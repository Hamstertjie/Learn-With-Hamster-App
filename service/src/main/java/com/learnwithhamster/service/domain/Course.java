package com.learnwithhamster.service.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.learnwithhamster.service.domain.enumeration.Level;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Course.
 */
@Entity
@Table(name = "course")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@org.springframework.data.elasticsearch.annotations.Document(indexName = "course")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Course implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull
    @Column(name = "course_title", nullable = false)
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Text)
    private String courseTitle;

    @Column(name = "course_description")
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Text)
    private String courseDescription;

    @Column(name = "course_price")
    private Long coursePrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "course_level")
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Keyword)
    private Level courseLevel;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "course")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @org.springframework.data.annotation.Transient
    @JsonIgnoreProperties(value = { "discipline", "program", "course", "lesson" }, allowSetters = true)
    private Set<Resource> resources = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "rel_course__lessons",
        joinColumns = @JoinColumn(name = "course_id"),
        inverseJoinColumns = @JoinColumn(name = "lessons_id")
    )
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "resources", "courses" }, allowSetters = true)
    private Set<Lesson> lessons = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY, mappedBy = "courses")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @org.springframework.data.annotation.Transient
    @JsonIgnoreProperties(value = { "resources", "courses", "disciplines" }, allowSetters = true)
    private Set<Program> programs = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Course id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getCourseTitle() {
        return this.courseTitle;
    }

    public Course courseTitle(String courseTitle) {
        this.setCourseTitle(courseTitle);
        return this;
    }

    public void setCourseTitle(String courseTitle) {
        this.courseTitle = courseTitle;
    }

    public String getCourseDescription() {
        return this.courseDescription;
    }

    public Course courseDescription(String courseDescription) {
        this.setCourseDescription(courseDescription);
        return this;
    }

    public void setCourseDescription(String courseDescription) {
        this.courseDescription = courseDescription;
    }

    public Long getCoursePrice() {
        return this.coursePrice;
    }

    public Course coursePrice(Long coursePrice) {
        this.setCoursePrice(coursePrice);
        return this;
    }

    public void setCoursePrice(Long coursePrice) {
        this.coursePrice = coursePrice;
    }

    public Level getCourseLevel() {
        return this.courseLevel;
    }

    public Course courseLevel(Level courseLevel) {
        this.setCourseLevel(courseLevel);
        return this;
    }

    public void setCourseLevel(Level courseLevel) {
        this.courseLevel = courseLevel;
    }

    public Set<Resource> getResources() {
        return this.resources;
    }

    public void setResources(Set<Resource> resources) {
        if (this.resources != null) {
            this.resources.forEach(i -> i.setCourse(null));
        }
        if (resources != null) {
            resources.forEach(i -> i.setCourse(this));
        }
        this.resources = resources;
    }

    public Course resources(Set<Resource> resources) {
        this.setResources(resources);
        return this;
    }

    public Course addResources(Resource resource) {
        this.resources.add(resource);
        resource.setCourse(this);
        return this;
    }

    public Course removeResources(Resource resource) {
        this.resources.remove(resource);
        resource.setCourse(null);
        return this;
    }

    public Set<Lesson> getLessons() {
        return this.lessons;
    }

    public void setLessons(Set<Lesson> lessons) {
        this.lessons = lessons;
    }

    public Course lessons(Set<Lesson> lessons) {
        this.setLessons(lessons);
        return this;
    }

    public Course addLessons(Lesson lesson) {
        this.lessons.add(lesson);
        return this;
    }

    public Course removeLessons(Lesson lesson) {
        this.lessons.remove(lesson);
        return this;
    }

    public Set<Program> getPrograms() {
        return this.programs;
    }

    public void setPrograms(Set<Program> programs) {
        if (this.programs != null) {
            this.programs.forEach(i -> i.removeCourses(this));
        }
        if (programs != null) {
            programs.forEach(i -> i.addCourses(this));
        }
        this.programs = programs;
    }

    public Course programs(Set<Program> programs) {
        this.setPrograms(programs);
        return this;
    }

    public Course addPrograms(Program program) {
        this.programs.add(program);
        program.getCourses().add(this);
        return this;
    }

    public Course removePrograms(Program program) {
        this.programs.remove(program);
        program.getCourses().remove(this);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Course)) {
            return false;
        }
        return getId() != null && getId().equals(((Course) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Course{" +
            "id=" + getId() +
            ", courseTitle='" + getCourseTitle() + "'" +
            ", courseDescription='" + getCourseDescription() + "'" +
            ", coursePrice=" + getCoursePrice() +
            ", courseLevel='" + getCourseLevel() + "'" +
            "}";
    }
}
