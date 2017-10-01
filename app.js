'use strict';
var app = (function(global,window,document,undefined) {

    // API Instagram не позволяет сделать запрос черз XMLHTTPRequest, поэтому использую JSONP
    function jsonp(url, callback) {
      var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
      window[callbackName] = function(data) {
        delete window[callbackName];
        document.body.removeChild(script);
        callback(data);
      };

      var script = document.createElement('script');
      script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + callbackName;
      document.body.appendChild(script);
    }

    // получить значение времени, прошедшего с момента публикации записи
    function getAgoTime(timestamp) {
      var now = new Date();
      var postDate = new Date(parseInt(timestamp) * 1000);
      var diff = parseInt((now - postDate) / 1000);

      if (diff < 60) {
        return diff + ' seconds';
      } else
      if (diff < 60 * 60) {
        return String(Math.round(diff / 60)) + 'm';
      } else
      if (diff < 60 * 60 * 24) {
        return String(Math.round(diff / 60 / 60)) + 'h';
      } else {
        return String(Math.round(diff / 60 / 60 / 24)) + 'd';
      }
    }

    // получить html одной карточки в виде String
    function getCardHtml(elementData) {
      var template = document.getElementById('template').textContent;

      var output = template
        .replace(new RegExp('\\${PHOTO}', 'g'), elementData.images.standard_resolution.url)
        .replace(new RegExp('\\${PORTRAIT}', 'g'), elementData.user.profile_picture)
        .replace(new RegExp('\\${NAME}', 'g'), elementData.user.username)
        .replace(new RegExp('\\${PLACEMENT}', 'g'), (elementData.location) ? elementData.location.name : '')
        .replace(new RegExp('\\${TIME_AGO}', 'g'), getAgoTime(elementData.created_time))
        .replace(new RegExp('\\${ID}', 'g'), elementData.id)
        .replace(new RegExp('\\${LIKES_COUNT}', 'g'), elementData.likes.count)
        .replace(new RegExp('\\${DESCRIPTION}', 'g'), (elementData.caption) ? elementData.caption.text : '');

      return output;
    }

    function renderCards(data) {
      var output = "";
      data.forEach(function(elementData) {
        output += getCardHtml(elementData);
      });
      document.getElementById('content').innerHTML = output;
    }

    function initMasonry() {
      var cards = document.querySelectorAll('.card');
      var row = 0;
      var cardsDom = {};
      var extraMargin = 30;

      [].forEach.call(cards,function(card,index) {
        cardsDom[index] = {};
        cardsDom[index]['height'] = card.offsetHeight;
        cardsDom[index]['left'] = card.offsetLeft;

        // просчитываем позицию элемента на основе высоты и позиции элемента выше
        if (row > 0) {
          var upperCard = cardsDom[index - 3];
          cardsDom[index]['top'] = upperCard['height'] + upperCard['top'] + extraMargin;
        } else {
          cardsDom[index]['top'] = card.offsetTop;
        }

        card.style.left = cardsDom[index]['left'] + 'px';
        card.style.top = cardsDom[index]['top'] + 'px';

        // новый ряд
        if ((index + 1) % 3 == 0 && index !== 0) {
          row++;
        }
      });

      // добавляем элементам position:absolute после всех вычислений
      [].forEach.call(cards, function(card) {
        card.classList.add('card--absolute');
      });
    }

    function onLoadEvent() {
      if (document.body.offsetWidth >= 1024) {
        // применяем masonry-раскладку при загрузке всей страницы, если ширина больше/равна 1024
        initMasonry();
      } else {
        // если ширина меньше 1024, отслеживаем изменения ширины окна до тех пор,
        // пока она не будет больше/равна 1024, чтобы применить masonry-раскладку
        window.onresize = function() {
          if (document.body.offsetWidth >= 1024) {
            initMasonry();
            window.onresize = null;
          }
        }
      }
    }

    function handleHeartClick(e) {
      if (e.target.classList.contains('likes__heart') || e.target.classList.contains('likes__heart-path')) {
        alert(e.target.getAttribute('data-targ'));
      }
    }

    // публичные методы
    return {
      init: function() {
        jsonp('https://api.instagram.com/v1/users/691623/media/recent?access_token=691623.1419b97.479e4603aff24de596b1bf18891729f3&count=20', function(data) {
          renderCards(data.data)
        });

        window.onload = onLoadEvent;

        // делегирование клика, чтобы не создавать обработчик для каждого сердца
        document.addEventListener('click', handleHeartClick);
      },
      destroy: function() {
        window.onload = null;
        document.removeEventListener('click', handleHeartClick)
      }
    }

})(this, window, window.document);

app.init();