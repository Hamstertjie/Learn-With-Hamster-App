package com.learnwithhamster.service.repository.search;

import co.elastic.clients.elasticsearch._types.query_dsl.QueryStringQuery;
import com.learnwithhamster.service.domain.Lesson;
import com.learnwithhamster.service.repository.LessonRepository;
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
 * Spring Data Elasticsearch repository for the {@link Lesson} entity.
 */
public interface LessonSearchRepository extends ElasticsearchRepository<Lesson, Long>, LessonSearchRepositoryInternal {}

interface LessonSearchRepositoryInternal {
    Page<Lesson> search(String query, Pageable pageable);

    Page<Lesson> search(Query query);

    @Async
    void index(Lesson entity);

    @Async
    void deleteFromIndexById(Long id);
}

class LessonSearchRepositoryInternalImpl implements LessonSearchRepositoryInternal {

    private final ElasticsearchTemplate elasticsearchTemplate;
    private final LessonRepository repository;

    LessonSearchRepositoryInternalImpl(ElasticsearchTemplate elasticsearchTemplate, LessonRepository repository) {
        this.elasticsearchTemplate = elasticsearchTemplate;
        this.repository = repository;
    }

    @Override
    public Page<Lesson> search(String query, Pageable pageable) {
        NativeQuery nativeQuery = new NativeQuery(QueryStringQuery.of(qs -> qs.query(query))._toQuery());
        return search(nativeQuery.setPageable(pageable));
    }

    @Override
    public Page<Lesson> search(Query query) {
        SearchHits<Lesson> searchHits = elasticsearchTemplate.search(query, Lesson.class);
        List<Lesson> hits = searchHits.map(SearchHit::getContent).stream().toList();
        return new PageImpl<>(hits, query.getPageable(), searchHits.getTotalHits());
    }

    @Override
    public void index(Lesson entity) {
        repository.findById(entity.getId()).ifPresent(elasticsearchTemplate::save);
    }

    @Override
    public void deleteFromIndexById(Long id) {
        elasticsearchTemplate.delete(String.valueOf(id), Lesson.class);
    }
}
