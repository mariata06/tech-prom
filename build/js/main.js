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

// Мобильное меню навигации
var mobileMenu = document.querySelector(".navigation");
var burgerButton = document.querySelector(".navigation__burger-menu");
var closeMenu = document.querySelector(".navigation__close");
var htmlDoc = document.querySelector("html");

window.addEventListener("resize", function() {
  if (window.innerWidth > 767) {
    burgerButton.classList.add("navigation__burger-menu--disabled");
  } else {
    burgerButton.classList.remove("navigation__burger-menu--disabled");
  }

  burgerButton.addEventListener("click", function(evt) {
    evt.preventDefault();
    burgerButton.classList.add("navigation__burger-menu--hide");
    closeMenu.classList.add("navigation__close--show");
    mobileMenu.classList.add("navigation--mobile");
    htmlDoc.classList.add("disable-scroll");
  });
});

closeMenu.addEventListener("click", function(evt) {
  evt.preventDefault();
  burgerButton.classList.remove("navigation__burger-menu--hide");
  closeMenu.classList.remove("navigation__close--show");
  mobileMenu.classList.remove("navigation--mobile");
  htmlDoc.classList.toggle("disable-scroll");
});
