package com.learnwithhamster.service.domain;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.Cache;
import org.hibernate.annotations.CacheConcurrencyStrategy;

/**
 * A Program.
 */
@Entity
@Table(name = "program")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@org.springframework.data.elasticsearch.annotations.Document(indexName = "program")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Program implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull
    @Column(name = "program_name", nullable = false)
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Text)
    private String programName;

    @Column(name = "program_description")
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Text)
    private String programDescription;

    @Column(name = "program_price")
    private Long programPrice;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "program")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @org.springframework.data.annotation.Transient
    @JsonIgnoreProperties(value = { "discipline", "program", "course", "lesson" }, allowSetters = true)
    private Set<Resource> resources = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "rel_program__courses",
        joinColumns = @JoinColumn(name = "program_id"),
        inverseJoinColumns = @JoinColumn(name = "courses_id")
    )
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "resources", "lessons", "programs" }, allowSetters = true)
    private Set<Course> courses = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY, mappedBy = "programs")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @org.springframework.data.annotation.Transient
    @JsonIgnoreProperties(value = { "resources", "programs" }, allowSetters = true)
    private Set<Discipline> disciplines = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Program id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProgramName() {
        return this.programName;
    }

    public Program programName(String programName) {
        this.setProgramName(programName);
        return this;
    }

    public void setProgramName(String programName) {
        this.programName = programName;
    }

    public String getProgramDescription() {
        return this.programDescription;
    }

    public Program programDescription(String programDescription) {
        this.setProgramDescription(programDescription);
        return this;
    }

    public void setProgramDescription(String programDescription) {
        this.programDescription = programDescription;
    }

    public Long getProgramPrice() {
        return this.programPrice;
    }

    public Program programPrice(Long programPrice) {
        this.setProgramPrice(programPrice);
        return this;
    }

    public void setProgramPrice(Long programPrice) {
        this.programPrice = programPrice;
    }

    public Set<Resource> getResources() {
        return this.resources;
    }

    public void setResources(Set<Resource> resources) {
        if (this.resources != null) {
            this.resources.forEach(i -> i.setProgram(null));
        }
        if (resources != null) {
            resources.forEach(i -> i.setProgram(this));
        }
        this.resources = resources;
    }

    public Program resources(Set<Resource> resources) {
        this.setResources(resources);
        return this;
    }

    public Program addResources(Resource resource) {
        this.resources.add(resource);
        resource.setProgram(this);
        return this;
    }

    public Program removeResources(Resource resource) {
        this.resources.remove(resource);
        resource.setProgram(null);
        return this;
    }

    public Set<Course> getCourses() {
        return this.courses;
    }

    public void setCourses(Set<Course> courses) {
        this.courses = courses;
    }

    public Program courses(Set<Course> courses) {
        this.setCourses(courses);
        return this;
    }

    public Program addCourses(Course course) {
        this.courses.add(course);
        return this;
    }

    public Program removeCourses(Course course) {
        this.courses.remove(course);
        return this;
    }

    public Set<Discipline> getDisciplines() {
        return this.disciplines;
    }

    public void setDisciplines(Set<Discipline> disciplines) {
        if (this.disciplines != null) {
            this.disciplines.forEach(i -> i.removePrograms(this));
        }
        if (disciplines != null) {
            disciplines.forEach(i -> i.addPrograms(this));
        }
        this.disciplines = disciplines;
    }

    public Program disciplines(Set<Discipline> disciplines) {
        this.setDisciplines(disciplines);
        return this;
    }

    public Program addDisciplines(Discipline discipline) {
        this.disciplines.add(discipline);
        discipline.getPrograms().add(this);
        return this;
    }

    public Program removeDisciplines(Discipline discipline) {
        this.disciplines.remove(discipline);
        discipline.getPrograms().remove(this);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Program)) {
            return false;
        }
        return getId() != null && getId().equals(((Program) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Program{" +
            "id=" + getId() +
            ", programName='" + getProgramName() + "'" +
            ", programDescription='" + getProgramDescription() + "'" +
            ", programPrice=" + getProgramPrice() +
            "}";
    }
}
