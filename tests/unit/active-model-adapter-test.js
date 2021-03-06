import {moduleFor, test} from 'ember-qunit';
import {module} from 'qunit';
import Ember from 'ember';
import FactoryGuy, {build, buildList, make, makeList, mockCreate, manualSetup} from 'ember-data-factory-guy';

import SharedAdapterBehavior from './shared-adapter-tests';
import SharedFactoryGuyTestHelperBehavior from './shared-factory-guy-test-helper-tests';
import {inlineSetup} from '../helpers/utility-methods';

let serializer = 'DS.ActiveModelSerializer';
let serializerType = '-active-model';

SharedAdapterBehavior.all(serializer, serializerType);

SharedFactoryGuyTestHelperBehavior.mockFindRecordSideloadingTests(serializer, serializerType);
SharedFactoryGuyTestHelperBehavior.mockFindAllSideloadingTests(serializer, serializerType);

SharedFactoryGuyTestHelperBehavior.mockQueryMetaTests(serializer, serializerType);

SharedFactoryGuyTestHelperBehavior.mockUpdateWithErrorMessages(serializer, serializerType);
SharedFactoryGuyTestHelperBehavior.mockUpdateReturnsAssociations(serializer, serializerType);
SharedFactoryGuyTestHelperBehavior.mockUpdateReturnsEmbeddedAssociations(serializer, serializerType);

SharedFactoryGuyTestHelperBehavior.mockCreateReturnsAssociations(serializer, serializerType);
SharedFactoryGuyTestHelperBehavior.mockCreateFailsWithErrorResponse(serializer, serializerType);
SharedFactoryGuyTestHelperBehavior.mockCreateReturnsEmbeddedAssociations(serializer, serializerType);

moduleFor('serializer:application', `${serializer} #mockCreate custom`, inlineSetup(serializerType));

test("returns camelCase attributes", function(assert) {
  Ember.run(()=> {
    let done = assert.async();
    let customDescription = "special description";

    mockCreate('profile').returns({ camel_case_description: customDescription });

    FactoryGuy.store.createRecord('profile', { camel_case_description: 'description' })
      .save().then((profile)=> {
        assert.ok(profile.get('camelCaseDescription') === customDescription);
        done();
      });
  });
});

moduleFor('serializer:application', `${serializer} FactoryGuy#build custom`, inlineSetup(serializerType));

test("embeds belongsTo record when serializer attrs => embedded: always ", function(assert) {

  let buildJson = build('comic-book', 'marvel');
  buildJson.unwrap();

  let expectedJson = {
    comic_book: {
      id: 1,
      name: 'Comic Times #1',
      company: { id: 1, type: 'Company', name: 'Marvel Comics' }
    }
  };

  assert.deepEqual(buildJson, expectedJson);
});


test("sideloads belongsTo records which are built from fixture definition", function(assert) {

  let buildJson = build('profile', 'with_bat_man');
  buildJson.unwrap();

  let expectedJson = {
    profile: {
      id: 1,
      description: 'Text goes here',
      camel_case_description: 'textGoesHere',
      snake_case_description: 'text_goes_here',
      a_boolean_field: false,
      super_hero_id: 1,
    },
    'super-heros': [
      {
        id: 1,
        name: "BatMan",
        type: "SuperHero"
      }
    ]
  };

  assert.deepEqual(buildJson, expectedJson);
});

test("sideloads belongsTo record passed as ( prebuilt ) attribute", function(assert) {

  let batMan = build('bat_man');
  let buildJson = build('profile', { superHero: batMan });
  buildJson.unwrap();

  let expectedJson = {
    profile: {
      id: 1,
      description: 'Text goes here',
      camel_case_description: 'textGoesHere',
      snake_case_description: 'text_goes_here',
      a_boolean_field: false,
      super_hero_id: 1,
    },
    'super-heros': [
      {
        id: 1,
        name: "BatMan",
        type: "SuperHero"
      }
    ]
  };

  assert.deepEqual(buildJson, expectedJson);
});

test("sideloads hasMany records built from fixture definition", function(assert) {

  let buildJson = build('user', 'with_hats');
  buildJson.unwrap();

  let expectedJson = {
    user: {
      id: 1,
      name: 'User1',
      style: "normal",
      hats: [
        { type: 'big_hat', id: 1 },
        { type: 'big_hat', id: 2 }
      ],
    },
    'big-hats': [
      { id: 1, type: "BigHat" },
      { id: 2, type: "BigHat" }
    ]
  };

  assert.deepEqual(buildJson, expectedJson);
});


test("sideloads hasMany records passed as prebuilt ( buildList ) attribute", function(assert) {

  let hats = buildList('big-hat', 2);
  let buildJson = build('user', { hats: hats });
  buildJson.unwrap();

  let expectedJson = {
    user: {
      id: 1,
      name: 'User1',
      style: "normal",
      hats: [
        { type: 'big_hat', id: 1 },
        { type: 'big_hat', id: 2 }
      ],
    },
    'big-hats': [
      { id: 1, type: "BigHat" },
      { id: 2, type: "BigHat" }
    ]
  };

  assert.deepEqual(buildJson, expectedJson);
});


test("sideloads hasMany records passed as prebuilt ( array of build ) attribute", function(assert) {

  let hat1 = build('big-hat');
  let hat2 = build('big-hat');
  let buildJson = build('user', { hats: [hat1, hat2] });
  buildJson.unwrap();

  let expectedJson = {
    user: {
      id: 1,
      name: 'User1',
      style: "normal",
      hats: [
        { type: 'big_hat', id: 1 },
        { type: 'big_hat', id: 2 }
      ],
    },
    'big-hats': [
      { id: 1, type: "BigHat" },
      { id: 2, type: "BigHat" }
    ]
  };

  assert.deepEqual(buildJson, expectedJson);
});


test("using custom serialize keys function for transforming attributes and relationship keys", function(assert) {
  let serializer = FactoryGuy.store.serializerFor('application');

  let savedKeyForAttributeFn = serializer.keyForAttribute;
  serializer.keyForAttribute = Ember.String.dasherize;
  let savedKeyForRelationshipFn = serializer.keyForRelationship;
  serializer.keyForRelationship = Ember.String.dasherize;

  let buildJson = build('profile', 'with_bat_man');
  buildJson.unwrap();

  let expectedJson = {
    profile: {
      id: 1,
      description: 'Text goes here',
      'camel-case-description': 'textGoesHere',
      'snake-case-description': 'text_goes_here',
      'a-boolean-field': false,
      'super-hero': 1,
    },
    'super-heros': [
      {
        id: 1,
        name: "BatMan",
        type: "SuperHero"
      }
    ]
  };

  assert.deepEqual(buildJson, expectedJson);

  serializer.keyForAttribute = savedKeyForAttributeFn;
  serializer.keyForRelationship = savedKeyForRelationshipFn;
});

test("serializes attributes with custom type", function(assert) {
  let info = { first: 1 };
  let buildJson = build('user', { info: info });
  buildJson.unwrap();

  let expectedJson = {
    user: {
      id: 1,
      name: 'User1',
      style: "normal",
      info: '{"first":1}'
    }
  };

  assert.deepEqual(buildJson, expectedJson);
});
