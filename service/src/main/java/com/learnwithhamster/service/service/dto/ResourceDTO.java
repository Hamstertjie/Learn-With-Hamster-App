package com.learnwithhamster.service.service.dto;

import com.learnwithhamster.service.domain.enumeration.ResourceType;
import java.io.Serializable;
import java.util.Objects;

/**
 * A DTO for the {@link com.learnwithhamster.service.domain.Resource} entity.
 */
@SuppressWarnings("common-java:DuplicatedBlocks")
public class ResourceDTO implements Serializable {

    private Long id;

    private String resourceName;

    private String resourceDescription;

    private String resourceURL;

    private String resourcePreviewImage;

    private ResourceType resourceType;

    private Integer weight;

    private DisciplineDTO discipline;

    private ProgramDTO program;

    private CourseDTO course;

    private LessonDTO lesson;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getResourceName() {
        return resourceName;
    }

    public void setResourceName(String resourceName) {
        this.resourceName = resourceName;
    }

    public String getResourceDescription() {
        return resourceDescription;
    }

    public void setResourceDescription(String resourceDescription) {
        this.resourceDescription = resourceDescription;
    }

    public String getResourceURL() {
        return resourceURL;
    }

    public void setResourceURL(String resourceURL) {
        this.resourceURL = resourceURL;
    }

    public String getResourcePreviewImage() {
        return resourcePreviewImage;
    }

    public void setResourcePreviewImage(String resourcePreviewImage) {
        this.resourcePreviewImage = resourcePreviewImage;
    }

    public ResourceType getResourceType() {
        return resourceType;
    }

    public void setResourceType(ResourceType resourceType) {
        this.resourceType = resourceType;
    }

    public Integer getWeight() {
        return weight;
    }

    public void setWeight(Integer weight) {
        this.weight = weight;
    }

    public DisciplineDTO getDiscipline() {
        return discipline;
    }

    public void setDiscipline(DisciplineDTO discipline) {
        this.discipline = discipline;
    }

    public ProgramDTO getProgram() {
        return program;
    }

    public void setProgram(ProgramDTO program) {
        this.program = program;
    }

    public CourseDTO getCourse() {
        return course;
    }

    public void setCourse(CourseDTO course) {
        this.course = course;
    }

    public LessonDTO getLesson() {
        return lesson;
    }

    public void setLesson(LessonDTO lesson) {
        this.lesson = lesson;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof ResourceDTO)) {
            return false;
        }

        ResourceDTO resourceDTO = (ResourceDTO) o;
        if (this.id == null) {
            return false;
        }
        return Objects.equals(this.id, resourceDTO.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(this.id);
    }

    // prettier-ignore
    @Override
    public String toString() {
        return "ResourceDTO{" +
            "id=" + getId() +
            ", resourceName='" + getResourceName() + "'" +
            ", resourceDescription='" + getResourceDescription() + "'" +
            ", resourceURL='" + getResourceURL() + "'" +
            ", resourcePreviewImage='" + getResourcePreviewImage() + "'" +
            ", resourceType='" + getResourceType() + "'" +
            ", weight=" + getWeight() +
            ", discipline=" + getDiscipline() +
            ", program=" + getProgram() +
            ", course=" + getCourse() +
            ", lesson=" + getLesson() +
            "}";
    }
}
