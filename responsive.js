// Shared navigation for the home, catalogue and product pages.
(() => {
  const button = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-navigation');
  if (!button || !nav) return;
  button.hidden = false;
  document.documentElement.classList.add('has-mobile-menu');
  const close = () => button.setAttribute('aria-expanded', 'false');
  button.addEventListener('click', () => {
    button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') !== 'true'));
  });
  nav.addEventListener('click', event => {
    if (event.target.closest('a')) close();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      close(); button.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('header')) close();
  });
  window.matchMedia('(min-width: 769px)').addEventListener('change', close);
})();
