// 共用功能：頁尾、影片嵌入與章節跳秒、首頁分區列表
(function () {
  var VIDEOS = window.VIDEOS || {};

  function ytUrl(key, t) {
    var id = VIDEOS[key];
    if (!id || id.indexOf("drive:") === 0 || isFile(id)) return "";
    return "https://www.youtube.com/watch?v=" + id + (t ? "&t=" + t + "s" : "");
  }

  // 直接放影片檔（例如GitHub Release附件）：值寫完整網址
  function isFile(id) { return /^https?:\/\//.test(id); }

  function fmt(t) {
    var h = Math.floor(t / 3600), m = Math.floor(t / 60) % 60, s = t % 60;
    var mm = h ? String(m).padStart(2, "0") : String(m);
    return (h ? h + ":" : "") + mm + ":" + String(s).padStart(2, "0");
  }

  // 頁尾：像書的作者欄，整頁只出現這一次
  var footer = document.querySelector("[data-footer]");
  if (footer) {
    footer.innerHTML =
      '<div class="inner">' +
      '<p>錄影與整理：Wilson（Wilson AI Lab）・歡迎轉貼和做筆記，請標註出處（<a href="https://creativecommons.org/licenses/by/4.0/deed.zh-hant" rel="license">CC BY 4.0</a>）</p>' +
      '<p>想要更多AI工具實測？ ' +
      '<a href="https://www.youtube.com/@WilsonAILab">YouTube</a>・' +
      '<a href="https://wilsonailab.com">網站</a></p>' +
      "</div>";
  }

  // 影片嵌入：沒填YouTube ID就顯示預留框
  document.querySelectorAll(".video[data-video]").forEach(function (box) {
    var id = VIDEOS[box.dataset.video];
    if (id && isFile(id)) {
      var poster = box.dataset.poster ? ' poster="' + box.dataset.poster + '"' : "";
      box.innerHTML = '<video controls preload="metadata" playsinline' + poster + ' src="' + id + '"></video>';
      // 手機瀏覽器不播GitHub附件影片時，改顯示下載按鈕
      var size = box.dataset.size ? "（" + box.dataset.size + "）" : "";
      var fallback = function () {
        box.innerHTML = '<div class="placeholder"><div><p>這個瀏覽器無法直接播放，請下載後觀看' + size + '</p>' +
          '<p><a class="btn" href="' + id + '">📥 下載影片</a></p><p class="video-caption">手機建議連Wi-Fi下載</p></div></div>';
      };
      var v = box.querySelector("video");
      v.addEventListener("error", fallback);
      var src = v.querySelector("source") || v;
      src.addEventListener("error", fallback);
    } else if (id && id.indexOf("drive:") === 0) {
      // Google雲端硬碟影片（需設成「知道連結的人可檢視」）
      box.innerHTML =
        '<iframe src="https://drive.google.com/file/d/' + id.slice(6) +
        '/preview" title="影片" loading="lazy" allow="autoplay" allowfullscreen></iframe>';
    } else if (id) {
      box.innerHTML =
        '<iframe src="https://www.youtube-nocookie.com/embed/' + id +
        '" title="YouTube影片" loading="lazy" allowfullscreen ' +
        'allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>';
    } else {
      box.innerHTML = '<div class="placeholder">影片上傳YouTube後會顯示在這裡</div>';
    }
  });

  // 章節：時間碼連到YouTube對應秒數；沒影片時只顯示時間
  document.querySelectorAll(".chapters li[data-video]").forEach(function (li) {
    var key = li.dataset.video, t = parseInt(li.dataset.t, 10);
    var a = li.querySelector(".time");
    a.textContent = fmt(t);
    var url = ytUrl(key, t);
    if (url) { a.href = url; a.target = "_blank"; }
    else if (VIDEOS[key] && isFile(VIDEOS[key])) {
      // 影片檔就在頁面上：點時間直接跳到那一秒並捲回播放器
      a.href = "#video";
      a.addEventListener("click", function (e) {
        var v = document.querySelector('.video[data-video="' + key + '"] video');
        if (!v) return;
        e.preventDefault();
        v.currentTime = t; v.play();
        v.scrollIntoView({ behavior: "smooth", block: "center" });
      });
    }
  });


  // 首頁：依社群分區列出每一場（communities.json＋streams.json），可搜尋
  var groups = document.querySelector("[data-stream-groups]");
  if (groups) {
    Promise.all([fetch("communities.json").then(function (r) { return r.json(); }),
                 fetch("streams.json").then(function (r) { return r.json(); })]).then(function (res) {
      var comms = res[0], items = res[1];
      function card(s) {
        return '<li><a class="card" href="' + s.path + '">' +
          '<span class="date">' + s.date + "・" + s.platform + "</span>" +
          "<h3>" + s.title + "</h3><p>" + s.summary + "</p>" +
          '<div class="tags">' + s.tags.map(function (t) { return '<span class="tag">' + t + "</span>"; }).join("") + "</div>" +
          "</a></li>";
      }
      function render(q) {
        q = (q || "").trim().toLowerCase();
        var html = comms.map(function (c) {
          var list = items.filter(function (s) {
            return s.community === c.id && (!q || (JSON.stringify(s) + c.name).toLowerCase().indexOf(q) > -1);
          });
          if (!list.length) return "";
          return '<section class="community" id="' + c.id + '"><h2>' + c.name + '<span class="count">' + list.length + " 場</span></h2>" +
            '<p class="community-desc">' + c.desc + "</p>" +
            '<p class="community-links">' + [c.url ? '<a href="' + c.url + '">官網</a>' : "", c.discord ? '<a href="' + c.discord + '">加入Discord</a>' : ""].filter(Boolean).join("・") + "</p>" +
            '<ul class="stream-list">' + list.map(card).join("") + "</ul></section>";
        }).join("");
        groups.innerHTML = html || "<p class='note'>找不到符合的紀錄</p>";
      }
      render();
      var input = document.querySelector("[data-search]");
      if (input) input.addEventListener("input", function () { render(input.value); });
    });
  }
})();
