import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HomeDashboard from "./HomeDashboard.jsx";
import userContext from "../context/user.context.js";
import "../styles/landing.css";

const navigation = [
  { label: "The signal", href: "#signal" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Community", href: "#community" },
];

function SignalMark({ className = "" }: { className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <span className={`signal-mark ${className}`} aria-hidden="true">
      <span className="signal-mark__core" />
      <motion.span
        className="signal-mark__ring signal-mark__ring--one"
        animate={reduceMotion ? undefined : { scale: [0.82, 1.22], opacity: [0.65, 0] }}
        transition={reduceMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: "easeOut" }}
      />
      <motion.span
        className="signal-mark__ring signal-mark__ring--two"
        animate={reduceMotion ? undefined : { scale: [0.82, 1.22], opacity: [0.55, 0] }}
        transition={reduceMotion ? undefined : { duration: 2.8, delay: 1.4, repeat: Infinity, ease: "easeOut" }}
      />
    </span>
  );
}

function SiteNav({
  menuOpen,
  onMenuOpenChange,
}: {
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}) {
  const reduceMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    let previousY = window.scrollY;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        const currentY = window.scrollY;
        setScrolled(currentY > 24);
        const focusIsInNavigation =
          document.activeElement instanceof HTMLElement &&
          Boolean(document.activeElement.closest(".site-nav"));
        if (!menuOpen && !focusIsInNavigation && currentY > 150 && currentY > previousY + 4) {
          setHidden(true);
        } else if (currentY < previousY - 4 || currentY < 24 || menuOpen) {
          setHidden(false);
        }
        previousY = currentY;
        frame = 0;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const menuTrigger = toggleRef.current;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onMenuOpenChange(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.body.classList.add("menu-is-open");
    window.addEventListener("keydown", onKeyDown);
    const focusFrame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLElement>("a[href]")?.focus();
    });
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.classList.remove("menu-is-open");
      window.removeEventListener("keydown", onKeyDown);
      menuTrigger?.focus();
    };
  }, [menuOpen, onMenuOpenChange]);

  const closeMenu = () => onMenuOpenChange(false);

  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <motion.header
        className={`site-nav${scrolled ? " is-scrolled" : ""}${hidden ? " is-hidden" : ""}`}
        initial={reduceMotion ? false : { y: -24, opacity: 0 }}
        animate={{ y: hidden ? "-110%" : "0%", opacity: 1 }}
        onFocusCapture={() => setHidden(false)}
        transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link className="brand-lockup" to="/" aria-label="Commonplace home" onClick={closeMenu}>
          <SignalMark className="brand-lockup__mark" />
          <span>COMMONPLACE<span className="brand-lockup__period">.</span></span>
        </Link>

        <nav className="desktop-nav" aria-label="Primary">
          {navigation.map((item) => (
            <a className="nav-item" href={item.href} key={item.href}>{item.label}</a>
          ))}
        </nav>

        <div className="nav-actions">
          <Link className="nav-signin" to="/login">Sign in</Link>
          <Link className="button button--nav" to="/register">
            Find your people <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <button
          className={`menu-toggle${menuOpen ? " is-open" : ""}`}
          type="button"
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          ref={toggleRef}
          onClick={() => onMenuOpenChange(!menuOpen)}
        >
          <span /><span />
        </button>
      </motion.header>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            id="mobile-navigation"
            className="mobile-nav"
            aria-label="Mobile primary"
            ref={menuRef}
            initial={reduceMotion ? false : { opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: reduceMotion ? 0 : 0.22 }}
          >
            {navigation.map((item, index) => (
              <motion.a
                href={item.href}
                key={item.href}
                onClick={closeMenu}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduceMotion ? 0 : index * 0.05 }}
              >
                {item.label}<span aria-hidden="true">↗</span>
              </motion.a>
            ))}
            <Link to="/login" onClick={closeMenu}>Sign in</Link>
            <Link className="button" to="/register" onClick={closeMenu}>Find your people <span>↗</span></Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </>
  );
}

function Hero() {
  const reduceMotion = useReducedMotion();
  const entrance = (delay: number) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] as const },
        };

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-copy">
        <motion.p className="eyebrow hero-eyebrow" {...entrance(0.15)}>
          <span className="status-light" /> THE FREQUENCY IS YOURS
        </motion.p>
        <h1 id="hero-title" className="hero-title">
          <span className="hero-line"><motion.span {...entrance(0.26)}>Find your</motion.span></span>
          <span className="hero-line"><motion.span {...entrance(0.38)} className="hero-title__signal">people<span className="hero-title__dot">.</span></motion.span></span>
        </h1>
        <motion.p className="hero-subtitle" {...entrance(0.64)}>
          A little corner of the internet for the people who make your world
          feel more like yours.
        </motion.p>
        <motion.div className="hero-actions" {...entrance(0.8)}>
          <Link className="button button--primary" to="/register">
            Tune in <span aria-hidden="true">↗</span>
          </Link>
          <a className="text-link" href="#signal">Get the frequency <span aria-hidden="true">↓</span></a>
        </motion.div>
        <motion.div className="hero-footnote" {...entrance(1.12)}>
          <span className="hero-footnote__line" />
          SMALL CIRCLE. STRONG SIGNAL.
        </motion.div>
      </div>

      <motion.div
        className="hero-visual"
        aria-label="A radar signal finding its community"
        role="img"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.92, filter: "blur(8px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: reduceMotion ? 0 : 1, delay: reduceMotion ? 0 : 0.92, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="radar-panel">
          <span className="radar-coordinate radar-coordinate--top">41° 24′ 12″ N</span>
          <span className="radar-coordinate radar-coordinate--bottom">SIGNAL / 001</span>
          <svg className="radar-svg" viewBox="0 0 560 560" aria-hidden="true">
            <defs>
              <radialGradient id="radar-glow">
                <stop offset="0" stopColor="var(--brand-500)" stopOpacity=".22" />
                <stop offset="1" stopColor="var(--brand-500)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="radar-sweep" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="var(--brand-500)" stopOpacity="0" />
                <stop offset="1" stopColor="var(--brand-500)" stopOpacity=".35" />
              </linearGradient>
            </defs>
            <circle cx="280" cy="280" r="240" fill="url(#radar-glow)" />
            <circle cx="280" cy="280" r="75" />
            <circle cx="280" cy="280" r="150" />
            <circle cx="280" cy="280" r="225" />
            <path d="M55 280h450M280 55v450M120 120l320 320M440 120 120 440" />
            <motion.path
              className="radar-sweep"
              d="M280 280 280 55 A225 225 0 0 1 439 121Z"
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={reduceMotion ? undefined : { duration: 18, repeat: Infinity, ease: "linear" }}
              style={{ transformOrigin: "280px 280px" }}
            />
            <circle className="radar-blip radar-blip--one" cx="355" cy="193" r="6" />
            <circle className="radar-blip radar-blip--two" cx="186" cy="345" r="5" />
            <circle className="radar-blip radar-blip--three" cx="408" cy="324" r="4" />
            <circle className="radar-center" cx="280" cy="280" r="9" />
          </svg>
          <div className="radar-caption">
            <SignalMark />
            <span>YOU ARE NOT<br />OUT THERE ALONE</span>
          </div>
          <span className="radar-side-label">COMMUNITY FREQUENCY&nbsp; / &nbsp;98.4</span>
        </div>
        <motion.span
          className="hero-visual-tag"
          {...entrance(1.1)}
        >
          <span /> YOUR PEOPLE ARE CLOSER THAN YOU THINK
        </motion.span>
      </motion.div>

      <motion.div className="hero-bottomline" {...entrance(1.25)}>
        <span>MADE FOR THE MOMENTS BETWEEN THE MESSAGES</span>
        <a href="#signal" aria-label="Scroll to learn about the signal">SCROLL TO EXPLORE <span>↓</span></a>
      </motion.div>
    </section>
  );
}

function LandingPage() {
  const reduceMotion = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const appear = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-12% 0px" },
        transition: { duration: 0.72, ease: [0.16, 1, 0.3, 1] as const },
      };

  return (
    <div className="site-shell" id="top">
      <SiteNav menuOpen={menuOpen} onMenuOpenChange={setMenuOpen} />
      <main id="main-content" inert={menuOpen} aria-hidden={menuOpen || undefined}>
        <Hero />

        <section className="signal-strip" id="community" aria-label="Commonplace at a glance">
          <span className="mono-label">WHAT FINDS YOU HERE</span>
          <span className="signal-strip__item"><i /> Small moments</span>
          <span className="signal-strip__item"><i /> Your circle</span>
          <span className="signal-strip__item"><i /> Room to be real</span>
          <span className="mono-label signal-strip__right">A SPACE, NOT A STAGE</span>
        </section>

        <section className="manifesto section-wrap" id="signal" aria-labelledby="manifesto-title">
          <motion.div className="manifesto-label" {...appear}>
            <span className="section-index">01 / THE WHY</span>
            <span className="signal-tick" />
          </motion.div>
          <motion.div className="manifesto-copy" {...appear}>
            <h2 id="manifesto-title">
              Less broadcast.<br />
              <span>More being</span> <em>there.</em>
            </h2>
            <p>
              The best parts of being online aren’t loud. They’re a photo from
              your friend, a thought you meant to share, a familiar name showing
              up again. Commonplace is built around those little signals.
            </p>
          </motion.div>
          <div className="manifesto-visual" aria-hidden="true">
            <span className="manifesto-orbit manifesto-orbit--a" />
            <span className="manifesto-orbit manifesto-orbit--b" />
            <SignalMark className="manifesto-mark" />
            <span className="manifesto-coordinate">SIGNAL FOUND<br />DISTANCE: CLOSER</span>
          </div>
        </section>

        <section className="features-section section-wrap" aria-labelledby="features-title">
          <motion.header className="section-heading" {...appear}>
            <div>
              <span className="section-index">02 / THE FREQUENCY</span>
              <h2 id="features-title">Your people.<br /><em>In the picture.</em></h2>
            </div>
            <p>Not another megaphone. A better way to stay close to the people who matter.</p>
          </motion.header>
          <div className="feature-grid">
            <motion.article className="feature-card feature-card--feed" {...appear}>
              <div className="feature-card__top"><span>01 / THE FIELD NOTES</span><span>↗</span></div>
              <div className="feed-motif" aria-hidden="true">
                <div className="feed-motif__head"><span /><i /><i /><i /></div>
                <div className="feed-motif__image"><SignalMark /></div>
                <div className="feed-motif__caption"><b /><b /></div>
              </div>
              <h3>A feed with a pulse.</h3>
              <p>Share a thought or a photo. Catch the little things your circle puts into the world.</p>
              <span className="feature-card__index">YOUR EVERYDAY TRANSMISSION</span>
            </motion.article>
            <motion.article className="feature-card feature-card--stories" {...appear}>
              <div className="feature-card__top"><span>02 / THE QUICK PING</span><span>↗</span></div>
              <div className="story-motif" aria-hidden="true">
                <span className="story-motif__tile story-motif__tile--one"><i /></span>
                <span className="story-motif__tile story-motif__tile--two"><i /></span>
                <span className="story-motif__tile story-motif__tile--three"><i /></span>
                <span className="story-motif__signal"><SignalMark /></span>
              </div>
              <h3>Moments, while they’re here.</h3>
              <p>Stories make space for the unplanned, everyday snapshots that disappear after a day.</p>
              <span className="feature-card__index">A SIGNAL THAT PASSES THROUGH</span>
            </motion.article>
            <motion.article className="feature-card feature-card--people" {...appear}>
              <div className="feature-card__top"><span>03 / YOUR ORBIT</span><span>↗</span></div>
              <div className="orbit-motif" aria-hidden="true">
                <span className="orbit-motif__path orbit-motif__path--one" />
                <span className="orbit-motif__path orbit-motif__path--two" />
                <i className="orbit-motif__dot orbit-motif__dot--a" />
                <i className="orbit-motif__dot orbit-motif__dot--b" />
                <i className="orbit-motif__dot orbit-motif__dot--c" />
                <span className="orbit-motif__center">YOU</span>
              </div>
              <h3>Your circle, not a crowd.</h3>
              <p>Switch from the full community feed to posts from the people already in your circle.</p>
              <span className="feature-card__index">CLOSE ENOUGH TO FEEL CLOSE</span>
            </motion.article>
          </div>
        </section>

        <section className="steps-section" id="how-it-works" aria-labelledby="steps-title">
          <div className="steps-inner">
            <motion.header className="steps-heading" {...appear}>
              <span className="section-index">03 / THE FIRST CONTACT</span>
              <h2 id="steps-title">Easy as<br /><em>showing up.</em></h2>
              <p>No grand entrance. Just a few small steps into a better kind of social space.</p>
            </motion.header>
            <div className="steps-list">
              {([
                ["01", "Claim your frequency", "Choose your name and make a space that feels like you."],
                ["02", "Tune into your circle", "See community posts, or narrow the feed to people already in your circle."],
                ["03", "Send a little signal", "Post what’s happening, or share a fleeting story."],
              ] as const).map(([number, title, description], index) => (
                <motion.article
                  className="step-row"
                  key={number}
                  {...(reduceMotion ? {} : {
                    initial: { opacity: 0, x: 22 },
                    whileInView: { opacity: 1, x: 0 },
                    viewport: { once: true, margin: "-10% 0px" },
                    transition: { duration: 0.65, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] as const },
                  })}
                >
                  <span className="step-row__number">{number}</span>
                  <div><h3>{title}</h3><p>{description}</p></div>
                  <span className="step-row__arrow" aria-hidden="true">↗</span>
                </motion.article>
              ))}
              <span className="steps-rail" aria-hidden="true" />
            </div>
          </div>
        </section>

        <section className="manifesto-echo" aria-label="Community over noise">
          <motion.div className="manifesto-echo__inner" {...appear}>
            <SignalMark />
            <p>THE BEST SIGNAL<br />IS <em>RECIPROCAL.</em></p>
            <span>Listen a little. Share a little. Stay in range.</span>
          </motion.div>
        </section>

        <section className="cta-banner" aria-labelledby="cta-title">
          <div className="cta-banner__grid" aria-hidden="true" />
          <SignalMark className="cta-banner__mark" />
          <motion.div className="cta-banner__content" {...appear}>
            <span className="section-index">YOUR PEOPLE ARE ON THE FREQUENCY</span>
            <h2 id="cta-title">Come into<br /><em>range.</em></h2>
            <p>Make room for the people who make the ordinary feel like something.</p>
            <Link className="button button--primary button--large" to="/register">
              Find your people <span aria-hidden="true">↗</span>
            </Link>
          </motion.div>
          <span className="cta-banner__code">CP / 98.4<br />LIVE SIGNAL</span>
        </section>
      </main>

      <footer className="site-footer" inert={menuOpen} aria-hidden={menuOpen || undefined}>
        <div className="footer-top">
          <div>
            <span className="section-index">STAY WITHIN RANGE</span>
            <p>Good things<br />travel <em>both ways.</em></p>
          </div>
          <a className="footer-backtop" href="#top" aria-label="Back to the top">
            Back to the beginning <span aria-hidden="true">↑</span>
          </a>
        </div>
        <div className="footer-grid">
          <div className="footer-brand">
            <Link className="brand-lockup" to="/">
              <SignalMark className="brand-lockup__mark" />
              <span>COMMONPLACE<span className="brand-lockup__period">.</span></span>
            </Link>
            <p>A small social space for the people who make life feel like yours.</p>
          </div>
          <nav aria-label="Footer — Explore">
            <span>EXPLORE</span>
            <a href="#signal">The idea</a>
            <a href="#how-it-works">How it works</a>
            <a href="#community">Community</a>
          </nav>
          <nav aria-label="Footer — Your space">
            <span>YOUR SPACE</span>
            <Link to="/login">Sign in</Link>
            <Link to="/register">Join Commonplace</Link>
          </nav>
          <div className="footer-status">
            <span>TRANSMISSION STATUS</span>
            <p><i /> OPEN FREQUENCY</p>
            <span>MADE FOR BEING HERE</span>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} COMMONPLACE</span>
          <span>NO NOISE. JUST YOUR PEOPLE.</span>
          <span>CP / 98.4</span>
        </div>
        <div className="footer-wordmark" aria-hidden="true">COMMONPLACE</div>
      </footer>
    </div>
  );
}

export default function Home() {
  const { user, loading } = useContext(userContext);

  if (loading) {
    return (
      <main className="session-loading" aria-live="polite">
        <SignalMark />
        <p>Finding the frequency…</p>
      </main>
    );
  }

  return user ? <HomeDashboard /> : <LandingPage />;
}
