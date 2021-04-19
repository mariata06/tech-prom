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
