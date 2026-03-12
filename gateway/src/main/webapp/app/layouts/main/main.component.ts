import { Component, OnInit, OnDestroy, Renderer2, RendererFactory2, inject, NgZone } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import dayjs from 'dayjs/esm';

import { AccountService } from 'app/core/auth/account.service';
import { AppPageTitleStrategy } from 'app/app-page-title-strategy';
import FindLanguageFromKeyPipe from 'app/shared/language/find-language-from-key.pipe';
import FooterComponent from '../footer/footer.component';
import PageRibbonComponent from '../profiles/page-ribbon.component';

@Component({
  selector: 'jhi-main',
  templateUrl: './main.component.html',
  providers: [AppPageTitleStrategy],
  imports: [RouterOutlet, FooterComponent, PageRibbonComponent],
})
export default class MainComponent implements OnInit, OnDestroy {
  private readonly renderer: Renderer2;
  private cursorEl: HTMLElement | null = null;
  private cursorRingEl: HTMLElement | null = null;
  private mouseX = 0;
  private mouseY = 0;
  private ringX = 0;
  private ringY = 0;
  private rafId: number | null = null;
  private readonly boundMouseMove: (e: MouseEvent) => void;
  private readonly boundMouseOver: (e: MouseEvent) => void;
  private revealObserver: IntersectionObserver | null = null;
  private navRaf: number | null = null;

  private readonly router = inject(Router);
  private readonly appPageTitleStrategy = inject(AppPageTitleStrategy);
  private readonly accountService = inject(AccountService);
  private readonly findLanguageFromKeyPipe = inject(FindLanguageFromKeyPipe);
  private readonly translateService = inject(TranslateService);
  private readonly rootRenderer = inject(RendererFactory2);
  private readonly zone = inject(NgZone);

  constructor() {
    this.renderer = this.rootRenderer.createRenderer(document.querySelector('html'), null);
    this.boundMouseMove = this.onMouseMove.bind(this);
    this.boundMouseOver = this.onMouseOver.bind(this);
  }

  ngOnInit(): void {
    this.accountService.identity().subscribe();

    this.translateService.onLangChange.subscribe((langChangeEvent: LangChangeEvent) => {
      this.appPageTitleStrategy.updateTitle(this.router.routerState.snapshot);
      dayjs.locale(langChangeEvent.lang);
      this.renderer.setAttribute(document.querySelector('html'), 'lang', langChangeEvent.lang);
      this.updatePageDirection();
    });

    // Run cursor and scroll-reveal outside Angular zone to avoid triggering change detection
    this.zone.runOutsideAngular(() => {
      this.initCursor();
      this.initScrollReveal();
      // Re-run scroll reveal when route changes
      this.router.events.subscribe(() => {
        setTimeout(() => this.attachRevealToNewElements(), 300);
      });
    });
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.boundMouseMove);
    document.removeEventListener('mouseover', this.boundMouseOver);
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.navRaf !== null) cancelAnimationFrame(this.navRaf);
    this.revealObserver?.disconnect();
  }

  private initCursor(): void {
    this.cursorEl = document.getElementById('ln-cursor');
    this.cursorRingEl = document.getElementById('ln-cursor-ring');
    if (!this.cursorEl || !this.cursorRingEl) return;

    document.addEventListener('mousemove', this.boundMouseMove, { passive: true });
    document.addEventListener('mouseover', this.boundMouseOver, { passive: true });
    this.animateCursorRing();
  }

  private onMouseMove(e: MouseEvent): void {
    this.mouseX = e.clientX;
    this.mouseY = e.clientY;
    if (this.cursorEl) {
      this.cursorEl.style.transform = `translate(${this.mouseX}px, ${this.mouseY}px) translate(-50%, -50%)`;
    }
  }

  private onMouseOver(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    const isHoverable = target.closest('a, button, [role="button"], .discipline-card, .course-card, .continue-card, .dashboard-card');
    if (this.cursorEl) this.cursorEl.classList.toggle('hovering', !!isHoverable);
    if (this.cursorRingEl) this.cursorRingEl.classList.toggle('hovering', !!isHoverable);
  }

  private animateCursorRing(): void {
    const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
    const animate = (): void => {
      this.ringX = lerp(this.ringX, this.mouseX, 0.12);
      this.ringY = lerp(this.ringY, this.mouseY, 0.12);
      if (this.cursorRingEl) {
        this.cursorRingEl.style.transform = `translate(${this.ringX}px, ${this.ringY}px) translate(-50%, -50%)`;
      }
      this.rafId = requestAnimationFrame(animate);
    };
    this.rafId = requestAnimationFrame(animate);
  }

  private initScrollReveal(): void {
    this.revealObserver = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            this.revealObserver?.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
    );
    this.attachRevealToNewElements();
  }

  private attachRevealToNewElements(): void {
    if (!this.revealObserver) return;
    document.querySelectorAll('.reveal:not(.revealed)').forEach(el => {
      this.revealObserver!.observe(el);
    });
  }

  private updatePageDirection(): void {
    this.renderer.setAttribute(
      document.querySelector('html'),
      'dir',
      this.findLanguageFromKeyPipe.isRTL(this.translateService.currentLang) ? 'rtl' : 'ltr',
    );
  }
}
