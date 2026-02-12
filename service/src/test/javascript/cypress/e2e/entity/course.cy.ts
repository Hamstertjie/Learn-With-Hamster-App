import {
  entityConfirmDeleteButtonSelector,
  entityCreateButtonSelector,
  entityCreateCancelButtonSelector,
  entityCreateSaveButtonSelector,
  entityDeleteButtonSelector,
  entityDetailsBackButtonSelector,
  entityDetailsButtonSelector,
  entityEditButtonSelector,
  entityTableSelector,
} from '../../support/entity';

describe('Course e2e test', () => {
  const coursePageUrl = '/service/course';
  const coursePageUrlPattern = new RegExp('/service/course(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const courseSample = { courseTitle: 'not archive' };

  let course;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/service/api/courses+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/service/api/courses').as('postEntityRequest');
    cy.intercept('DELETE', '/services/service/api/courses/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (course) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/service/api/courses/${course.id}`,
      }).then(() => {
        course = undefined;
      });
    }
  });

  it('Courses menu should load Courses page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('service/course');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response?.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Course').should('exist');
    cy.url().should('match', coursePageUrlPattern);
  });

  describe('Course page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(coursePageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Course page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/service/course/new$'));
        cy.getEntityCreateUpdateHeading('Course');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', coursePageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/service/api/courses',
          body: courseSample,
        }).then(({ body }) => {
          course = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/service/api/courses+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              headers: {
                link: '<http://localhost/services/service/api/courses?page=0&size=20>; rel="last",<http://localhost/services/service/api/courses?page=0&size=20>; rel="first"',
              },
              body: [course],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(coursePageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Course page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('course');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', coursePageUrlPattern);
      });

      it('edit button click should load edit Course page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Course');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', coursePageUrlPattern);
      });

      it('edit button click should load edit Course page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Course');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', coursePageUrlPattern);
      });

      it('last delete button click should delete instance of Course', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('course').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', coursePageUrlPattern);

        course = undefined;
      });
    });
  });

  describe('new Course page', () => {
    beforeEach(() => {
      cy.visit(`${coursePageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Course');
    });

    it('should create an instance of Course', () => {
      cy.get(`[data-cy="courseTitle"]`).type('flashy');
      cy.get(`[data-cy="courseTitle"]`).should('have.value', 'flashy');

      cy.get(`[data-cy="courseDescription"]`).type('needy broadly conceal');
      cy.get(`[data-cy="courseDescription"]`).should('have.value', 'needy broadly conceal');

      cy.get(`[data-cy="coursePrice"]`).type('18840');
      cy.get(`[data-cy="coursePrice"]`).should('have.value', '18840');

      cy.get(`[data-cy="courseLevel"]`).select('PROFESSIONAL');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(201);
        course = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(200);
      });
      cy.url().should('match', coursePageUrlPattern);
    });
  });
});
