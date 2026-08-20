/** Site nav: mobile menu + Products / Integration dropdowns. */
export function initSiteNav(root: ParentNode = document): void {
  const nav = root.querySelector<HTMLElement>('.nav')
  if (!nav) return

  const toggle = nav.querySelector<HTMLButtonElement>('[data-nav-toggle]')
  const links = nav.querySelector<HTMLElement>('[data-nav-links]')
  const dropdowns = nav.querySelectorAll<HTMLElement>('[data-dropdown]')

  const closeDropdowns = () => {
    dropdowns.forEach((dd) => {
      dd.classList.remove('is-open')
      const btn = dd.querySelector<HTMLButtonElement>('[data-drop-toggle]')
      btn?.setAttribute('aria-expanded', 'false')
    })
  }

  const closeMobile = () => {
    links?.classList.remove('is-open')
    toggle?.setAttribute('aria-expanded', 'false')
    closeDropdowns()
  }

  dropdowns.forEach((dd) => {
    const btn = dd.querySelector<HTMLButtonElement>('[data-drop-toggle]')
    if (!btn) return
    btn.addEventListener('click', (e) => {
      e.stopPropagation()
      const open = !dd.classList.contains('is-open')
      closeDropdowns()
      dd.classList.toggle('is-open', open)
      btn.setAttribute('aria-expanded', String(open))
    })
  })

  document.addEventListener('click', closeDropdowns)

  toggle?.addEventListener('click', () => {
    const open = links?.classList.toggle('is-open') ?? false
    toggle.setAttribute('aria-expanded', String(open))
    if (!open) closeDropdowns()
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
