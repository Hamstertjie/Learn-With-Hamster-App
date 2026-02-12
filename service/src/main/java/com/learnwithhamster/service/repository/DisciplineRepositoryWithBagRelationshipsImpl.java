package com.learnwithhamster.service.repository;

import com.learnwithhamster.service.domain.Discipline;
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
public class DisciplineRepositoryWithBagRelationshipsImpl implements DisciplineRepositoryWithBagRelationships {

    private static final String ID_PARAMETER = "id";
    private static final String DISCIPLINES_PARAMETER = "disciplines";

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Optional<Discipline> fetchBagRelationships(Optional<Discipline> discipline) {
        return discipline.map(this::fetchPrograms);
    }

    @Override
    public Page<Discipline> fetchBagRelationships(Page<Discipline> disciplines) {
        return new PageImpl<>(fetchBagRelationships(disciplines.getContent()), disciplines.getPageable(), disciplines.getTotalElements());
    }

    @Override
    public List<Discipline> fetchBagRelationships(List<Discipline> disciplines) {
        return Optional.of(disciplines).map(this::fetchPrograms).orElse(Collections.emptyList());
    }

    Discipline fetchPrograms(Discipline result) {
        return entityManager
            .createQuery(
                "select discipline from Discipline discipline left join fetch discipline.programs where discipline.id = :id",
                Discipline.class
            )
            .setParameter(ID_PARAMETER, result.getId())
            .getSingleResult();
    }

    List<Discipline> fetchPrograms(List<Discipline> disciplines) {
        HashMap<Object, Integer> order = new HashMap<>();
        IntStream.range(0, disciplines.size()).forEach(index -> order.put(disciplines.get(index).getId(), index));
        List<Discipline> result = entityManager
            .createQuery(
                "select discipline from Discipline discipline left join fetch discipline.programs where discipline in :disciplines",
                Discipline.class
            )
            .setParameter(DISCIPLINES_PARAMETER, disciplines)
            .getResultList();
        Collections.sort(result, (o1, o2) -> Integer.compare(order.get(o1.getId()), order.get(o2.getId())));
        return result;
    }
}
