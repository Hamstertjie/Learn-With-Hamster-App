package com.learnwithhamster.service.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.learnwithhamster.service.domain.UserLessonProgress} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class UserLessonProgressDTO implements Serializable {

    private Long id;

    @NotNull
    private String userLogin;

    @NotNull
    private Long lessonId;

    private Long courseId;

    @NotNull
    private Instant startedAt;

    private Boolean completed;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserLogin() {
        return userLogin;
    }

    public void setUserLogin(String userLogin) {
        this.userLogin = userLogin;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserLessonProgressDTO)) {
            return false;
        }

        UserLessonProgressDTO that = (UserLessonProgressDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "UserLessonProgressDTO{" +
            "id=" + getId() +
            ", userLogin='" + getUserLogin() + "'" +
            ", lessonId=" + getLessonId() +
            ", courseId=" + getCourseId() +
            ", startedAt='" + getStartedAt() + "'" +
            ", completed='" + getCompleted() + "'" +
            "}";
    }
}
