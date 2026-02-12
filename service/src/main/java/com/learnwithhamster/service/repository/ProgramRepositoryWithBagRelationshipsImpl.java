package com.learnwithhamster.service.repository;

import com.learnwithhamster.service.domain.Program;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;

/**
 * Utility repository to load bag relationships based on https://vladmihalcea.com/hibernate-multiplebagfetchexception/
 */
public class ProgramRepositoryWithBagRelationshipsImpl implements ProgramRepositoryWithBagRelationships {

    private static final String ID_PARAMETER = "id";
    private static final String PROGRAMS_PARAMETER = "programs";

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Optional<Program> fetchBagRelationships(Optional<Program> program) {
        return program.map(this::fetchCourses);
    }

    @Override
    public Page<Program> fetchBagRelationships(Page<Program> programs) {
        return new PageImpl<>(fetchBagRelationships(programs.getContent()), programs.getPageable(), programs.getTotalElements());
    }

    @Override
    public List<Program> fetchBagRelationships(List<Program> programs) {
        return Optional.of(programs).map(this::fetchCourses).orElse(Collections.emptyList());
    }

    Program fetchCourses(Program result) {
        return entityManager
            .createQuery("select program from Program program left join fetch program.courses where program.id = :id", Program.class)
            .setParameter(ID_PARAMETER, result.getId())
            .getSingleResult();
    }

    List<Program> fetchCourses(List<Program> programs) {
        HashMap<Object, Integer> order = new HashMap<>();
        IntStream.range(0, programs.size()).forEach(index -> order.put(programs.get(index).getId(), index));
        List<Program> result = entityManager
            .createQuery("select program from Program program left join fetch program.courses where program in :programs", Program.class)
            .setParameter(PROGRAMS_PARAMETER, programs)
            .getResultList();
        Collections.sort(result, (o1, o2) -> Integer.compare(order.get(o1.getId()), order.get(o2.getId())));
        return result;
    }
}
