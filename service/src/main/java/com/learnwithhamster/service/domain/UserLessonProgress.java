package com.learnwithhamster.service.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.time.Instant;

/**
 * Tracks which lessons a user has visited.
 */
@Entity
@Table(
    name = "user_lesson_progress",
    uniqueConstraints = @UniqueConstraint(name = "ux_user_lesson_progress", columnNames = { "user_login", "lesson_id" })
)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class UserLessonProgress implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull
    @Column(name = "user_login", nullable = false, length = 50)
    private String userLogin;

    @NotNull
    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    @Column(name = "course_id")
    private Long courseId;

    @NotNull
    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "completed")
    private Boolean completed;

    public Long getId() {
        return this.id;
    }

    public UserLessonProgress id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserLogin() {
        return this.userLogin;
    }

    public UserLessonProgress userLogin(String userLogin) {
        this.setUserLogin(userLogin);
        return this;
    }

    public void setUserLogin(String userLogin) {
        this.userLogin = userLogin;
    }

    public Long getLessonId() {
        return this.lessonId;
    }

    public UserLessonProgress lessonId(Long lessonId) {
        this.setLessonId(lessonId);
        return this;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public Long getCourseId() {
        return this.courseId;
    }

    public UserLessonProgress courseId(Long courseId) {
        this.setCourseId(courseId);
        return this;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Instant getStartedAt() {
        return this.startedAt;
    }

    public UserLessonProgress startedAt(Instant startedAt) {
        this.setStartedAt(startedAt);
        return this;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Boolean getCompleted() {
        return this.completed;
    }

    public UserLessonProgress completed(Boolean completed) {
        this.setCompleted(completed);
        return this;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserLessonProgress)) {
            return false;
        }
        return getId() != null && getId().equals(((UserLessonProgress) o).getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "UserLessonProgress{" +
            "id=" + getId() +
            ", userLogin='" + getUserLogin() + "'" +
            ", lessonId=" + getLessonId() +
            ", courseId=" + getCourseId() +
            ", startedAt='" + getStartedAt() + "'" +
            ", completed='" + getCompleted() + "'" +
            "}";
    }
}
