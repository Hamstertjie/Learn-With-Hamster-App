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

describe('Discipline e2e test', () => {
  const disciplinePageUrl = '/service/discipline';
  const disciplinePageUrlPattern = new RegExp('/service/discipline(\\?.*)?$');
  const username = Cypress.env('E2E_USERNAME') ?? 'user';
  const password = Cypress.env('E2E_PASSWORD') ?? 'user';
  const disciplineSample = { disciplineName: 'meh' };

  let discipline;

  beforeEach(() => {
    cy.login(username, password);
  });

  beforeEach(() => {
    cy.intercept('GET', '/services/service/api/disciplines+(?*|)').as('entitiesRequest');
    cy.intercept('POST', '/services/service/api/disciplines').as('postEntityRequest');
    cy.intercept('DELETE', '/services/service/api/disciplines/*').as('deleteEntityRequest');
  });

  afterEach(() => {
    if (discipline) {
      cy.authenticatedRequest({
        method: 'DELETE',
        url: `/services/service/api/disciplines/${discipline.id}`,
      }).then(() => {
        discipline = undefined;
      });
    }
  });

  it('Disciplines menu should load Disciplines page', () => {
    cy.visit('/');
    cy.clickOnEntityMenuItem('service/discipline');
    cy.wait('@entitiesRequest').then(({ response }) => {
      if (response?.body.length === 0) {
        cy.get(entityTableSelector).should('not.exist');
      } else {
        cy.get(entityTableSelector).should('exist');
      }
    });
    cy.getEntityHeading('Discipline').should('exist');
    cy.url().should('match', disciplinePageUrlPattern);
  });

  describe('Discipline page', () => {
    describe('create button click', () => {
      beforeEach(() => {
        cy.visit(disciplinePageUrl);
        cy.wait('@entitiesRequest');
      });

      it('should load create Discipline page', () => {
        cy.get(entityCreateButtonSelector).click();
        cy.url().should('match', new RegExp('/service/discipline/new$'));
        cy.getEntityCreateUpdateHeading('Discipline');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', disciplinePageUrlPattern);
      });
    });

    describe('with existing value', () => {
      beforeEach(() => {
        cy.authenticatedRequest({
          method: 'POST',
          url: '/services/service/api/disciplines',
          body: disciplineSample,
        }).then(({ body }) => {
          discipline = body;

          cy.intercept(
            {
              method: 'GET',
              url: '/services/service/api/disciplines+(?*|)',
              times: 1,
            },
            {
              statusCode: 200,
              body: [discipline],
            },
          ).as('entitiesRequestInternal');
        });

        cy.visit(disciplinePageUrl);

        cy.wait('@entitiesRequestInternal');
      });

      it('detail button click should load details Discipline page', () => {
        cy.get(entityDetailsButtonSelector).first().click();
        cy.getEntityDetailsHeading('discipline');
        cy.get(entityDetailsBackButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', disciplinePageUrlPattern);
      });

      it('edit button click should load edit Discipline page and go back', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Discipline');
        cy.get(entityCreateSaveButtonSelector).should('exist');
        cy.get(entityCreateCancelButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', disciplinePageUrlPattern);
      });

      it('edit button click should load edit Discipline page and save', () => {
        cy.get(entityEditButtonSelector).first().click();
        cy.getEntityCreateUpdateHeading('Discipline');
        cy.get(entityCreateSaveButtonSelector).click();
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', disciplinePageUrlPattern);
      });

      it('last delete button click should delete instance of Discipline', () => {
        cy.get(entityDeleteButtonSelector).last().click();
        cy.getEntityDeleteDialogHeading('discipline').should('exist');
        cy.get(entityConfirmDeleteButtonSelector).click();
        cy.wait('@deleteEntityRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(204);
        });
        cy.wait('@entitiesRequest').then(({ response }) => {
          expect(response?.statusCode).to.equal(200);
        });
        cy.url().should('match', disciplinePageUrlPattern);

        discipline = undefined;
      });
    });
  });

  describe('new Discipline page', () => {
    beforeEach(() => {
      cy.visit(`${disciplinePageUrl}`);
      cy.get(entityCreateButtonSelector).click();
      cy.getEntityCreateUpdateHeading('Discipline');
    });

    it('should create an instance of Discipline', () => {
      cy.get(`[data-cy="disciplineName"]`).type('fiercely lest');
      cy.get(`[data-cy="disciplineName"]`).should('have.value', 'fiercely lest');

      cy.get(`[data-cy="disciplineDescription"]`).type('ugh tired');
      cy.get(`[data-cy="disciplineDescription"]`).should('have.value', 'ugh tired');

      cy.get(`[data-cy="disciplinePrice"]`).type('11076');
      cy.get(`[data-cy="disciplinePrice"]`).should('have.value', '11076');

      cy.get(entityCreateSaveButtonSelector).click();

      cy.wait('@postEntityRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(201);
        discipline = response.body;
      });
      cy.wait('@entitiesRequest').then(({ response }) => {
        expect(response?.statusCode).to.equal(200);
      });
      cy.url().should('match', disciplinePageUrlPattern);
    });
  });
});
