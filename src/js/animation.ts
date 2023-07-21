import {
  WebGLRenderer,
  Clock,
  Scene,
  AnimationMixer,
  LoopOnce,
  PerspectiveCamera,
  DirectionalLight,
  AmbientLight,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { MapControls } from 'three/examples/jsm/controls/MapControls';

let renderer;
let scene;
let gltfLoader;
let camera;
let controls;
let mixer;
let clock;
let animations;
let animationFlame;
const url = '../3d/mycity.glb';

const canvas = document.getElementById('canvas');
const btnAction = document.getElementById('btn-action') as HTMLButtonElement;
const btnStop = document.getElementById('btn-stop') as HTMLButtonElement;
const btnStart = document.getElementById('btn-start') as HTMLButtonElement;
const btnRange = document.getElementById('btn-range') as HTMLInputElement;
const btnMouseControl = document.getElementById('btn-mouseControl') as HTMLInputElement;
const btnScroll = document.getElementById('btn-scroll') as HTMLInputElement;

// ウィンドウサイズ設定
let width = window.innerWidth;
let height = window.innerHeight;

// 実行/イベント処理
window.addEventListener('DOMContentLoaded', init);
window.addEventListener('resize', onResize);

// btnAction?.addEventListener('click', function () {
//   window.cancelAnimationFrame(animationFlame);
//   if (animations && animations.length) {
//     for (let i = 0; i < animations.length; i++) {
//       let action = mixer.existingAction(animations[i]);
//       action.reset();
//     }
//   }
//   clock.elapsedTime = 0;
//   clock.start();
//   tick();
// });
// btnStop?.addEventListener('click', function () {
//   window.cancelAnimationFrame(animationFlame);
//   clock.stop();
// });
// btnStart?.addEventListener('click', function () {
//   tick();
//   clock.start();
// });
btnRange.addEventListener('input', function (e) {
  clock.stop();
  const target = e.target as HTMLInputElement;
  const rangeValue = Number(target.value);
  const cameraAnimation = animations.find((animation) => {
    return animation.name === 'cameraAction';
  });

  let action = mixer.existingAction(cameraAnimation);
  action.reset();
  mixer?.setTime(rangeValue / 25);
  renderer.render(scene, camera);
});
btnMouseControl.addEventListener('input', function (e) {
  const target = e.target as HTMLInputElement;
  const checked = target.checked;
  if (checked) {
    createCamera();
    tick();
    canvas.classList.add('mouseControl');
    disableBtns();
    btnScroll.checked = false;
    scrollDisable();
    btnRange.disabled = true;
  } else {
    clock.stop();
    camera = scene.children[0].children.find((child) => {
      return child.name === 'camera';
    });
    canvas.classList.remove('mouseControl');
    enableBtns();
    btnRange.disabled = false;
  }
});
btnScroll.addEventListener('input', function () {
  checkScrollBtn();
});
function checkScrollBtn() {
  btnRange.disabled = false;
  if (btnScroll.checked) {
    scrollEnable();
  } else {
    scrollDisable();
  }
}
function scrollEnable() {
  clock.stop();
  camera = scene.children[0].children.find((child) => {
    return child.name === 'camera';
  });
  canvas.classList.remove('mouseControl');
  document.body.classList.add('scroll');
  disableBtns();
  btnMouseControl.checked = false;
}
function scrollDisable() {
  document.body.classList.remove('scroll');
  enableBtns();
}

function disableBtns() {
  if (btnAction) btnAction.disabled = true;
  if (btnStop) btnStop.disabled = true;
  if (btnStart) btnStart.disabled = true;
}
function enableBtns() {
  if (btnAction) btnAction.disabled = false;
  if (btnStop) btnStop.disabled = false;
  if (btnStart) btnStart.disabled = false;
}
window.addEventListener('scroll', function () {
  const scrollY = window.scrollY;
  const scrollYEl = document.getElementById('scrollY');
  const cameraAnimation = animations.find((animation) => {
    return animation.name === 'cameraAction';
  });

  let action = mixer.existingAction(cameraAnimation);
  action.reset();
  mixer?.setTime(scrollY / 1000);
  renderer.render(scene, camera);
  scrollYEl.textContent = String(scrollY);
});

function init() {
  renderer = new WebGLRenderer({
    canvas: canvas,
    alpha: true,
  });

  // renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.setPixelRatio(1);
  renderer.setSize(width, height);

  clock = new Clock();

  scene = new Scene();

  // Load GLTF or GLB
  gltfLoader = new GLTFLoader();

  new Promise((resolve) => {
    gltfLoader.load(url, (gltf) => {
      animations = gltf.animations;
      const model = gltf.scene;

      if (animations && animations.length) {
        //Animation Mixerインスタンスを生成
        mixer = new AnimationMixer(gltf.scene);
        //全てのAnimation Clipに対して
        for (let i = 0; i < animations.length; i++) {
          //Animation Actionを生成
          let action = mixer.clipAction(animations[i]);
          //ループ設定（1回のみで終わらせる。これをコメントアウトするとループになる）
          action.setLoop(LoopOnce);
          //アニメーションの最後のフレームでアニメーションが終了（これがないと、最初の位置に戻って終了する）
          action.clampWhenFinished = true;
          //アニメーションを再生
          action.play();
        }
      }
      scene.add(model);
      resolve(model);
    });
  }).then((model) => {
    loadedObj();
    return model;
  });
}

// gltfロード後の処理
function loadedObj() {
  createCamera();
  createLight();
  // レンダー前にアスペクト比調整
  onResize();
  // 最初の状態を表示
  renderer.render(scene, camera);
  // tick開始
  if (btnMouseControl.checked) {
    tick();
  }
  // 「スクロールでカメラを進める」にチェック
  btnScroll.checked = true;
  checkScrollBtn();
}

function createCamera() {
  // blenderのカメラを使わない場合は、ここでカメラを作成する
  if (btnMouseControl.checked) {
    camera = new PerspectiveCamera(30, width / height, 1, 500);
    camera.position.set(0, 10, 30);
    controls = new MapControls(camera, renderer.domElement);
    // 慣性
    controls.enableDamping = true;
    controls.maxPolarAngle = Math.PI / 2;
    controls.maxDistance = 50;
  } else {
    camera = scene.children[0].children.find((child) => {
      return child.name === 'camera';
    });
  }
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function createLight() {
  const directionalLight = new DirectionalLight(0xfffacd);
  const ambientLight = new AmbientLight(0xffffff, 0.1);
  directionalLight.position.set(55, 70, 120);
  scene.add(directionalLight);
  scene.add(ambientLight);
}

function tick() {
  if (btnMouseControl.checked) {
    controls.update();
  }

  renderer.render(scene, camera);
  animationFlame = requestAnimationFrame(tick);

  //Animation Mixerを実行
  mixer?.update(clock.getDelta());
}

// リサイズイベント発生時に実行
function onResize() {
  // サイズを取得
  const width = window.innerWidth;
  const height = window.innerHeight;

  // レンダラーのサイズを調整する
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.render(scene, camera);

  // カメラのアスペクト比を正す
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}
