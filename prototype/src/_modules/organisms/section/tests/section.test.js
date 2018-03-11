'use strict';

import Section from '../section';

describe('Section View', function() {

  beforeEach(() => {
    this.section = new Section();
  });

  it('Should run a few assertions', () => {
    expect(this.section);
  });

});
