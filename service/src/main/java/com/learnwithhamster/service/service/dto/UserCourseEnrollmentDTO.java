package com.learnwithhamster.service.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.time.Instant;
import java.util.Objects;

/**
 * A DTO for the {@link com.learnwithhamster.service.domain.UserCourseEnrollment} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class UserCourseEnrollmentDTO implements Serializable {

    private Long id;

    @NotNull
    private String userLogin;

    @NotNull
    private Long courseId;

    @NotNull
    private Instant enrolledAt;

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

    public Long getCourseId() {
        return courseId;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Instant getEnrolledAt() {
        return enrolledAt;
    }

    public void setEnrolledAt(Instant enrolledAt) {
        this.enrolledAt = enrolledAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserCourseEnrollmentDTO)) {
            return false;
        }

        UserCourseEnrollmentDTO that = (UserCourseEnrollmentDTO) o;
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
        return "UserCourseEnrollmentDTO{" +
            "id=" + getId() +
            ", userLogin='" + getUserLogin() + "'" +
            ", courseId=" + getCourseId() +
            ", enrolledAt='" + getEnrolledAt() + "'" +
            "}";
    }
}
