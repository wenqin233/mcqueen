// public/js/global-music-player.js
// 全局音频播放器插件 - 挂载到window，页面跳转后状态不丢失
(function(window) {
  // 【配置项】修改为你的音乐列表，所有页面共用这个列表
  const MUSIC_LIST = [
    '/music/song1.mp3',
    '/music/song2.mp3',
    '/music/song3.mp3'
    // 加歌直接换行：'/music/song4.mp3'
  ];

  // 初始化全局状态（页面刷新/跳转后，先读取全局状态，无则初始化）
  if (!window.GlobalMusicPlayer) {
    window.GlobalMusicPlayer = {
      musicList: MUSIC_LIST,    // 全局音乐列表
      currentIndex: 0,          // 全局当前播放索引
      audioInstance: null,      // 全局音频核心实例（不创建DOM，只负责播放）
      isPlaying: false,         // 全局播放状态
      currentTime: 0            // 全局播放进度（秒）
    };
  }

  const gmp = window.GlobalMusicPlayer;

  // 1. 初始化全局音频实例（核心，脱离DOM，只负责播放，页面跳转不销毁）
  function initAudioInstance() {
    if (!gmp.audioInstance) {
      gmp.audioInstance = new Audio(); // 创建原生Audio实例，无DOM，纯逻辑播放
      // 绑定自动连播事件
      gmp.audioInstance.addEventListener('ended', playNextSong);
      // 实时保存播放进度（每100毫秒更新一次，页面跳转后恢复）
      gmp.audioInstance.addEventListener('timeupdate', () => {
        if (gmp.isPlaying) {
          gmp.currentTime = gmp.audioInstance.currentTime;
        }
      });
      // 保存播放/暂停状态
      gmp.audioInstance.addEventListener('play', () => {
        gmp.isPlaying = true;
      });
      gmp.audioInstance.addEventListener('pause', () => {
        gmp.isPlaying = false;
      });
    }
    // 恢复全局的当前歌曲和播放进度
    gmp.audioInstance.src = gmp.musicList[gmp.currentIndex];
    gmp.audioInstance.currentTime = gmp.currentTime;
  }

  // 2. 创建页面DOM播放器（带控制栏+下一首箭头按钮），每个页面加载后生成
  function createPlayerDom(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 清空容器，避免重复创建
    container.innerHTML = '';

    // 创建播放器DOM结构（和你要的样式一致：原生控制栏+醒目箭头下一首按钮）
    const playArea = document.createElement('div');
    playArea.className = 'global-music-play-area';

    const audioDom = document.createElement('audio');
    audioDom.className = 'global-music-audio';
    audioDom.controls = true;
    audioDom.preload = 'none';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'global-music-next-btn';
    nextBtn.innerText = '▶';
    nextBtn.title = '下一首';

    playArea.appendChild(audioDom);
    playArea.appendChild(nextBtn);
    container.appendChild(playArea);

    // 绑定DOM播放器和全局音频实例的联动（关键：DOM只负责控制，实际播放是全局实例）
    // DOM播放/暂停 → 同步到全局实例
    audioDom.addEventListener('play', () => {
      gmp.audioInstance.play().catch(err => {});
    });
    audioDom.addEventListener('pause', () => {
      gmp.audioInstance.pause();
    });
    // DOM音量调节 → 同步到全局实例
    audioDom.addEventListener('volumechange', () => {
      gmp.audioInstance.volume = audioDom.volume;
    });
    // 下一首按钮 → 调用全局切歌函数
    nextBtn.addEventListener('click', playNextSong);

    // 全局实例状态变化 → 同步到DOM播放器（确保页面跳转后DOM和全局状态一致）
    gmp.audioInstance.addEventListener('play', () => {
      audioDom.play().catch(err => {});
    });
    gmp.audioInstance.addEventListener('pause', () => {
      audioDom.pause();
    });
    gmp.audioInstance.addEventListener('timeupdate', () => {
      audioDom.currentTime = gmp.audioInstance.currentTime;
    });
    gmp.audioInstance.addEventListener('volumechange', () => {
      audioDom.volume = gmp.audioInstance.volume;
    });

    // 初始化DOM播放器的状态（和全局实例一致）
    audioDom.src = gmp.musicList[gmp.currentIndex];
    audioDom.currentTime = gmp.currentTime;
    audioDom.volume = gmp.audioInstance.volume || 1;
    if (gmp.isPlaying) {
      audioDom.play().catch(err => {});
    }
  }

  // 3. 全局切歌函数（下一首按钮+自动连播共用，更新全局状态）
  function playNextSong() {
    // 更新全局索引（循环切歌）
    gmp.currentIndex = (gmp.currentIndex + 1) % gmp.musicList.length;
    // 加载新歌曲，恢复播放（如果之前是播放状态）
    gmp.audioInstance.src = gmp.musicList[gmp.currentIndex];
    gmp.audioInstance.currentTime = 0;
    gmp.currentTime = 0;
    if (gmp.isPlaying) {
      gmp.audioInstance.play().catch(err => {});
    }
  }

  // 4. 全局初始化入口函数（每个页面加载后调用这个函数即可）
  window.initGlobalMusicPlayer = function(containerId) {
    initAudioInstance(); // 先初始化全局音频实例
    createPlayerDom(containerId); // 再创建页面DOM播放器
  };

})(window);