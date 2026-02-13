import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { AccountService } from 'app/core/auth/account.service';
import { LessonService } from 'app/entities/service/lesson/service/lesson.service';
import { ResourceService } from 'app/entities/service/resource/service/resource.service';
import { ILesson } from 'app/entities/service/lesson/lesson.model';
import { IResource } from 'app/entities/service/resource/resource.model';

@Component({
  selector: 'jhi-lesson-browse',
  templateUrl: './lesson-browse.component.html',
  styleUrl: './lesson-browse.component.scss',
  imports: [SharedModule, RouterModule],
})
export default class LessonBrowseComponent implements OnInit {
  lesson = signal<ILesson | null>(null);
  resources = signal<IResource[]>([]);
  isAuthenticated = signal(false);
  loading = signal(true);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly accountService = inject(AccountService);
  private readonly lessonService = inject(LessonService);
  private readonly resourceService = inject(ResourceService);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.accountService.identity().subscribe(account => {
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
    this.lessonService.find(id).subscribe(res => {
      this.lesson.set(res.body);

      this.resourceService.query({ size: 1000 }).subscribe(resourceRes => {
        const allResources: IResource[] = resourceRes.body ?? [];
        const filtered = allResources.filter(r => r.lesson?.id === id).sort((a, b) => (a.weight ?? 0) - (b.weight ?? 0));
        this.resources.set(filtered);
        this.loading.set(false);
      });
    });
  }
}
