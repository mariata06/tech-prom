// Переключение меню - аккордеона в блоке Производство, Информационный раздел
var accordionTriggers = document.querySelectorAll(".accordion__trigger");
var accordionItem = document.querySelectorAll(".accordion__item");
var arrowItems = document.querySelectorAll(".accordion__item-svg");

accordionTriggers.forEach(function (trigger) {
  trigger.addEventListener("click", () => {
    arrowItems.forEach(function (arrow) {
      arrow.style.transform = "none";
    });

    const parent = trigger.parentNode;
    var arrowItem = trigger.querySelector(".accordion__item-svg");
    arrowItem.style.transform = "rotate(90deg)";
    if (parent.classList.contains("accordion__item--active")) {
      parent.classList.remove("accordion__item--active");
      arrowItem.style.transform = "none";
    } else {
      accordionItem.forEach((child) => child.classList.remove("accordion__item--active"));
      parent.classList.add("accordion__item--active");
      arrowItem.style.transform = "rotate(90deg)";
    }
  });
});

// Липкое меню навигации при скролле страницы
window.onscroll = function showHeader() {

  var header = document.querySelector(".page-header");
  var logoMain = document.querySelector(".logo--main");
  var logoScroll = document.querySelector(".logo--scroll");

  if(window.pageYOffset > 200) {
    header.classList.add("page-header--fixed");
    logoMain.classList.add("logo--main--hide");
    logoScroll.classList.add("logo--scroll--show");
  } else {
    header.classList.remove("page-header--fixed");
    logoMain.classList.remove("logo--main--hide");
    logoScroll.classList.remove("logo--scroll--show");
  }
};
