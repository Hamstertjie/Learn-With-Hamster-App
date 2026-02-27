import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { CurrencyLocalePipe } from '../currency.pipe';
import { AccountService } from 'app/core/auth/account.service';
import { DisciplineService } from 'app/entities/service/discipline/service/discipline.service';
import { CourseService } from 'app/entities/service/course/service/course.service';
import { ResourceService } from 'app/entities/service/resource/service/resource.service';
import { IDiscipline } from 'app/entities/service/discipline/discipline.model';
import { ICourse } from 'app/entities/service/course/course.model';
import { IResource } from 'app/entities/service/resource/resource.model';

@Component({
  selector: 'jhi-discipline-browse',
  templateUrl: './discipline-browse.component.html',
  styleUrl: './discipline-browse.component.scss',
  imports: [SharedModule, RouterModule, CurrencyLocalePipe],
})
export default class DisciplineBrowseComponent implements OnInit {
  discipline = signal<IDiscipline | null>(null);
  courses = signal<ICourse[]>([]);
  resources = signal<IResource[]>([]);
  isAuthenticated = signal(false);
  loading = signal(true);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly disciplineService = inject(DisciplineService);
  private readonly courseService = inject(CourseService);
  private readonly resourceService = inject(ResourceService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.accountService.identity().pipe(takeUntilDestroyed(this.destroyRef)).subscribe(account => {
      this.isAuthenticated.set(account !== null);
      if (account !== null) {
        this.loadData(id);
      } else {
        this.loading.set(false);
      }
    });
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  private loadData(id: number): void {
    this.disciplineService.find(id).subscribe({
      next: res => {
        this.discipline.set(res.body);

        const disciplineProgramIds = new Set((res.body?.programs ?? []).map(p => p.id));

        this.courseService.query({ size: 1000, eagerload: true }).subscribe({
          next: courseRes => {
            const allCourses: ICourse[] = courseRes.body ?? [];
            const filtered = allCourses.filter(course => (course.programs ?? []).some(p => disciplineProgramIds.has(p.id)));
            this.courses.set(filtered);
          },
          error: () => { /* courses stay empty — resources callback still resolves loading */ },
        });

        this.resourceService.query({ size: 1000 }).subscribe({
          next: resourceRes => {
            const allResources: IResource[] = resourceRes.body ?? [];
            this.resources.set(allResources.filter(r => r.discipline?.id === id));
            this.loading.set(false);
          },
          error: () => { this.loading.set(false); },
        });
      },
      error: () => { this.loading.set(false); },
    });
  }
}
