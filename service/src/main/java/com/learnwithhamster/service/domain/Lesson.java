package com.learnwithhamster.service.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.learnwithhamster.service.domain.enumeration.Language;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Lesson.
 */
@Entity
@Table(name = "lesson")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@org.springframework.data.elasticsearch.annotations.Document(indexName = "lesson")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Lesson implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull
    @Column(name = "lesson_title", nullable = false)
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Text)
    private String lessonTitle;

    @Column(name = "lesson_description")
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Text)
    private String lessonDescription;

    @Enumerated(EnumType.STRING)
    @Column(name = "language")
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Keyword)
    private Language language;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "lesson")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @org.springframework.data.annotation.Transient
    @JsonIgnoreProperties(value = { "discipline", "program", "course", "lesson" }, allowSetters = true)
    private Set<Resource> resources = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY, mappedBy = "lessons")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @org.springframework.data.annotation.Transient
    @JsonIgnoreProperties(value = { "resources", "lessons", "programs" }, allowSetters = true)
    private Set<Course> courses = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Lesson id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getLessonTitle() {
        return this.lessonTitle;
    }

    public Lesson lessonTitle(String lessonTitle) {
        this.setLessonTitle(lessonTitle);
        return this;
    }

    public void setLessonTitle(String lessonTitle) {
        this.lessonTitle = lessonTitle;
    }

    public String getLessonDescription() {
        return this.lessonDescription;
    }

    public Lesson lessonDescription(String lessonDescription) {
        this.setLessonDescription(lessonDescription);
        return this;
    }

    public void setLessonDescription(String lessonDescription) {
        this.lessonDescription = lessonDescription;
    }

    public Language getLanguage() {
        return this.language;
    }

    public Lesson language(Language language) {
        this.setLanguage(language);
        return this;
    }

    public void setLanguage(Language language) {
        this.language = language;
    }

    public Set<Resource> getResources() {
        return this.resources;
    }

    public void setResources(Set<Resource> resources) {
        if (this.resources != null) {
            this.resources.forEach(i -> i.setLesson(null));
        }
        if (resources != null) {
            resources.forEach(i -> i.setLesson(this));
        }
        this.resources = resources;
    }

    public Lesson resources(Set<Resource> resources) {
        this.setResources(resources);
        return this;
    }

    public Lesson addResources(Resource resource) {
        this.resources.add(resource);
        resource.setLesson(this);
        return this;
    }

    public Lesson removeResources(Resource resource) {
        this.resources.remove(resource);
        resource.setLesson(null);
        return this;
    }

    public Set<Course> getCourses() {
        return this.courses;
    }

    public void setCourses(Set<Course> courses) {
        if (this.courses != null) {
            this.courses.forEach(i -> i.removeLessons(this));
        }
        if (courses != null) {
            courses.forEach(i -> i.addLessons(this));
        }
        this.courses = courses;
    }

    public Lesson courses(Set<Course> courses) {
        this.setCourses(courses);
        return this;
    }

    public Lesson addCourses(Course course) {
        this.courses.add(course);
        course.getLessons().add(this);
        return this;
    }

    public Lesson removeCourses(Course course) {
        this.courses.remove(course);
        course.getLessons().remove(this);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Lesson)) {
            return false;
        }
        return getId() != null && getId().equals(((Lesson) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Lesson{" +
            "id=" + getId() +
            ", lessonTitle='" + getLessonTitle() + "'" +
            ", lessonDescription='" + getLessonDescription() + "'" +
            ", language='" + getLanguage() + "'" +
            "}";
    }
}
