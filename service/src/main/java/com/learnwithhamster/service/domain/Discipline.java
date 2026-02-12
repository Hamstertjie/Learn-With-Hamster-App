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
 * A Discipline.
 */
@Entity
@Table(name = "discipline")
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@org.springframework.data.elasticsearch.annotations.Document(indexName = "discipline")
@SuppressWarnings("common-java:DuplicatedBlocks")
public class Discipline implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @NotNull
    @Column(name = "discipline_name", nullable = false)
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Text)
    private String disciplineName;

    @Column(name = "discipline_description")
    @org.springframework.data.elasticsearch.annotations.Field(type = org.springframework.data.elasticsearch.annotations.FieldType.Text)
    private String disciplineDescription;

    @Column(name = "discipline_price")
    private Long disciplinePrice;

    @OneToMany(fetch = FetchType.LAZY, mappedBy = "discipline")
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @org.springframework.data.annotation.Transient
    @JsonIgnoreProperties(value = { "discipline", "program", "course", "lesson" }, allowSetters = true)
    private Set<Resource> resources = new HashSet<>();

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "rel_discipline__programs",
        joinColumns = @JoinColumn(name = "discipline_id"),
        inverseJoinColumns = @JoinColumn(name = "programs_id")
    )
    @Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
    @JsonIgnoreProperties(value = { "resources", "courses", "disciplines" }, allowSetters = true)
    private Set<Program> programs = new HashSet<>();

    // jhipster-needle-entity-add-field - JHipster will add fields here

    public Long getId() {
        return this.id;
    }

    public Discipline id(Long id) {
        this.setId(id);
        return this;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDisciplineName() {
        return this.disciplineName;
    }

    public Discipline disciplineName(String disciplineName) {
        this.setDisciplineName(disciplineName);
        return this;
    }

    public void setDisciplineName(String disciplineName) {
        this.disciplineName = disciplineName;
    }

    public String getDisciplineDescription() {
        return this.disciplineDescription;
    }

    public Discipline disciplineDescription(String disciplineDescription) {
        this.setDisciplineDescription(disciplineDescription);
        return this;
    }

    public void setDisciplineDescription(String disciplineDescription) {
        this.disciplineDescription = disciplineDescription;
    }

    public Long getDisciplinePrice() {
        return this.disciplinePrice;
    }

    public Discipline disciplinePrice(Long disciplinePrice) {
        this.setDisciplinePrice(disciplinePrice);
        return this;
    }

    public void setDisciplinePrice(Long disciplinePrice) {
        this.disciplinePrice = disciplinePrice;
    }

    public Set<Resource> getResources() {
        return this.resources;
    }

    public void setResources(Set<Resource> resources) {
        if (this.resources != null) {
            this.resources.forEach(i -> i.setDiscipline(null));
        }
        if (resources != null) {
            resources.forEach(i -> i.setDiscipline(this));
        }
        this.resources = resources;
    }

    public Discipline resources(Set<Resource> resources) {
        this.setResources(resources);
        return this;
    }

    public Discipline addResources(Resource resource) {
        this.resources.add(resource);
        resource.setDiscipline(this);
        return this;
    }

    public Discipline removeResources(Resource resource) {
        this.resources.remove(resource);
        resource.setDiscipline(null);
        return this;
    }

    public Set<Program> getPrograms() {
        return this.programs;
    }

    public void setPrograms(Set<Program> programs) {
        this.programs = programs;
    }

    public Discipline programs(Set<Program> programs) {
        this.setPrograms(programs);
        return this;
    }

    public Discipline addPrograms(Program program) {
        this.programs.add(program);
        return this;
    }

    public Discipline removePrograms(Program program) {
        this.programs.remove(program);
        return this;
    }

    // jhipster-needle-entity-add-getters-setters - JHipster will add getters and setters here

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof Discipline)) {
            return false;
        }
        return getId() != null && getId().equals(((Discipline) o).getId());
    }

    @Override
    public int hashCode() {
        // see https://vladmihalcea.com/how-to-implement-equals-and-hashcode-using-the-jpa-entity-identifier/
        return getClass().hashCode();
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "Discipline{" +
            "id=" + getId() +
            ", disciplineName='" + getDisciplineName() + "'" +
            ", disciplineDescription='" + getDisciplineDescription() + "'" +
            ", disciplinePrice=" + getDisciplinePrice() +
            "}";
    }
}
