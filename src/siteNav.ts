/** Minimal site nav: mobile menu toggle (English only). */
export function initSiteNav(root: ParentNode = document): void {
  const nav = root.querySelector<HTMLElement>('.nav')
  if (!nav) return

  const toggle = nav.querySelector<HTMLButtonElement>('[data-nav-toggle]')
  const links = nav.querySelector<HTMLElement>('[data-nav-links]')

  const closeMobile = () => {
    links?.classList.remove('is-open')
    toggle?.setAttribute('aria-expanded', 'false')
  }

  toggle?.addEventListener('click', () => {
    const open = links?.classList.toggle('is-open') ?? false
    toggle.setAttribute('aria-expanded', String(open))
  })

  links?.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', closeMobile)
  })

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 8)
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()
}
