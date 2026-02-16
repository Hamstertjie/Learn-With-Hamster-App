package com.learnwithhamster.service.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.time.Instant;

/**
 * Tracks which courses a user has enrolled in.
 */
@Entity
@Table(
    name = "user_course_enrollment",
    uniqueConstraints = @UniqueConstraint(name = "ux_user_course_enrollment", columnNames = { "user_login", "course_id" })
)
@SuppressWarnings("common-java:DuplicatedBlocks")
public class UserCourseEnrollment implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull
    @Column(name = "user_login", nullable = false, length = 50)
    private String userLogin;

    @NotNull
    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @NotNull
    @Column(name = "enrolled_at", nullable = false)
    private Instant enrolledAt;

    public Long getId() {
        return this.id;
    }

    public UserCourseEnrollment id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserLogin() {
        return this.userLogin;
    }

    public UserCourseEnrollment userLogin(String userLogin) {
        this.setUserLogin(userLogin);
        return this;
    }

    public void setUserLogin(String userLogin) {
        this.userLogin = userLogin;
    }

    public Long getCourseId() {
        return this.courseId;
    }

    public UserCourseEnrollment courseId(Long courseId) {
        this.setCourseId(courseId);
        return this;
    }

    public void setCourseId(Long courseId) {
        this.courseId = courseId;
    }

    public Instant getEnrolledAt() {
        return this.enrolledAt;
    }

    public UserCourseEnrollment enrolledAt(Instant enrolledAt) {
        this.setEnrolledAt(enrolledAt);
        return this;
    }

    public void setEnrolledAt(Instant enrolledAt) {
        this.enrolledAt = enrolledAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof UserCourseEnrollment)) {
            return false;
        }
        return getId() != null && getId().equals(((UserCourseEnrollment) o).getId());
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "UserCourseEnrollment{" +
            "id=" + getId() +
            ", userLogin='" + getUserLogin() + "'" +
            ", courseId=" + getCourseId() +
            ", enrolledAt='" + getEnrolledAt() + "'" +
            "}";
    }
}
