package com.learnwithhamster.service.service.dto;

import jakarta.validation.constraints.*;
import java.io.Serializable;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;

/**
 * A DTO for the {@link com.learnwithhamster.service.domain.Program} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ProgramDTO implements Serializable {

    private Long id;

    @NotNull
    private String programName;

    private String programDescription;

    private Long programPrice;

    private Set<CourseDTO> courses = new HashSet<>();

    private Set<DisciplineDTO> disciplines = new HashSet<>();

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getProgramName() {
        return programName;
    }

    public void setProgramName(String programName) {
        this.programName = programName;
    }

    public String getProgramDescription() {
        return programDescription;
    }

    public void setProgramDescription(String programDescription) {
        this.programDescription = programDescription;
    }

    public Long getProgramPrice() {
        return programPrice;
    }

    public void setProgramPrice(Long programPrice) {
        this.programPrice = programPrice;
    }

    public Set<CourseDTO> getCourses() {
        return courses;
    }

    public void setCourses(Set<CourseDTO> courses) {
        this.courses = courses;
    }

    public Set<DisciplineDTO> getDisciplines() {
        return disciplines;
    }

    public void setDisciplines(Set<DisciplineDTO> disciplines) {
        this.disciplines = disciplines;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ProgramDTO)) {
            return false;
        }

        ProgramDTO programDTO = (ProgramDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, programDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ProgramDTO{" +
            "id=" + getId() +
            ", programName='" + getProgramName() + "'" +
            ", programDescription='" + getProgramDescription() + "'" +
            ", programPrice=" + getProgramPrice() +
            ", courses=" + getCourses() +
            ", disciplines=" + getDisciplines() +
            "}";
    }
}
