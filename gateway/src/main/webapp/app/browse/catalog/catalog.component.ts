import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { DisciplineService } from 'app/entities/service/discipline/service/discipline.service';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { IDiscipline } from 'app/entities/service/discipline/discipline.model';
import { ICourse } from 'app/entities/service/course/course.model';

@Component({
  selector: 'jhi-catalog',
  templateUrl: './catalog.component.html',
  styleUrl: './catalog.component.scss',
  imports: [SharedModule, RouterModule],
})
export default class CatalogComponent implements OnInit {
  disciplines = signal<IDiscipline[]>([]);
  courseCountMap = signal<Record<number, number>>({});
  isAuthenticated = signal(false);
  loading = signal(true);

  private readonly accountService = inject(AccountService);
  private readonly disciplineService = inject(DisciplineService);
  private readonly courseService = inject(CourseService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.accountService.identity().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(account => {
      this.isAuthenticated.set(account !== null);
      if (account !== null) {
        this.loadData();
      } else {
        this.loading.set(false);
      }
    });
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  private loadData(): void {
    this.disciplineService.query({ size: 1000, eagerload: true }).subscribe({
      next: res => {
        this.disciplines.set(res.body ?? []);

        this.courseService.query({ size: 1000, eagerload: true }).subscribe({
          next: courseRes => {
            const courses: ICourse[] = courseRes.body ?? [];
            const countMap: Record<number, number> = {};

            for (const discipline of this.disciplines()) {
              const disciplineProgramIds = new Set((discipline.programs ?? []).map(p => p.id));
              let count = 0;
              for (const course of courses) {
                const courseProgramIds = (course.programs ?? []).map(p => p.id);
                if (courseProgramIds.some(pid => disciplineProgramIds.has(pid))) {
                  count++;
                }
              }
              countMap[discipline.id] = count;
            }

            this.courseCountMap.set(countMap);
            this.loading.set(false);
          },
          error: () => { this.loading.set(false); },
        });
      },
      error: () => { this.loading.set(false); },
    });
  }
}
