export function renderPlaceHolder(element) {
  window.portalReactRoot.render(element);
}

export function clearPlaceHolder() {
  window.portalReactRoot.render(null);
}