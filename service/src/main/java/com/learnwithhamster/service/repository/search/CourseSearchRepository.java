package com.learnwithhamster.service.repository.search;

import co.elastic.clients.elasticsearch._types.query_dsl.QueryStringQuery;
import com.learnwithhamster.service.domain.Course;
import com.learnwithhamster.service.repository.CourseRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchTemplate;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.data.elasticsearch.core.query.Query;
import org.springframework.data.elasticsearch.repository.ElasticsearchRepository;
import org.springframework.scheduling.annotation.Async;

/**
 * Spring Data Elasticsearch repository for the {@link Course} entity.
 */
public interface CourseSearchRepository extends ElasticsearchRepository<Course, Long>, CourseSearchRepositoryInternal {}

interface CourseSearchRepositoryInternal {
    Page<Course> search(String query, Pageable pageable);

    Page<Course> search(Query query);

    @Async
    void index(Course entity);

    @Async
    void deleteFromIndexById(Long id);
}

class CourseSearchRepositoryInternalImpl implements CourseSearchRepositoryInternal {

    private final ElasticsearchTemplate elasticsearchTemplate;
    private final CourseRepository repository;

    CourseSearchRepositoryInternalImpl(ElasticsearchTemplate elasticsearchTemplate, CourseRepository repository) {
        this.elasticsearchTemplate = elasticsearchTemplate;
        this.repository = repository;
    }

    @Override
    public Page<Course> search(String query, Pageable pageable) {
        NativeQuery nativeQuery = new NativeQuery(QueryStringQuery.of(qs -> qs.query(query))._toQuery());
        return search(nativeQuery.setPageable(pageable));
    }

    @Override
    public Page<Course> search(Query query) {
        SearchHits<Course> searchHits = elasticsearchTemplate.search(query, Course.class);
        List<Course> hits = searchHits.map(SearchHit::getContent).stream().toList();
        return new PageImpl<>(hits, query.getPageable(), searchHits.getTotalHits());
    }

    @Override
    public void index(Course entity) {
        repository.findOneWithEagerRelationships(entity.getId()).ifPresent(elasticsearchTemplate::save);
    }

    @Override
    public void deleteFromIndexById(Long id) {
        elasticsearchTemplate.delete(String.valueOf(id), Course.class);
    }
}
