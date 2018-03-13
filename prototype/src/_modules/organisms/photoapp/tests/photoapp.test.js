'use strict';

import Photoapp from '../photoapp';

describe('Photoapp View', function() {

  beforeEach(() => {
    this.photoapp = new Photoapp();
  });

  it('Should run a few assertions', () => {
    expect(this.photoapp);
  });

});
