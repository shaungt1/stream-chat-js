import chai from 'chai';
const expect = chai.expect;

describe('campaigns', () => {
	describe('segments', () => {
		describe('creating a segment', () => {
			describe('when the description is empty', () => {
				it('returns 400');
			});
			describe('when the description is not empty', () => {
				describe('when filter is empty', () => {
					it('returns 400');
				});
				describe('when filter contains channel', () => {
					describe('when type is missing/empty', () => {
						it('returns 400');
					});
				});
				describe('when filter contains user', () => {
					it('validates contents/props or returns 400');
				});
				describe('when filter is ok', () => {
					it('returns 201');
					it('returns the new segment');
					describe('returned segment', () => {
						it('has an id');
						it('has a number of recipients');
					});
				});
			});
		});
		describe('retrieving a segment', () => {
			describe('when the segment is not found', () => {
				it('returns 404');
			});
			describe('when the segment is found', () => {
				it('returns 200');
				it('returns the segment');
				describe('returned segment', () => {
					it('has an id');
					it('has a number of recipients');
				});
			});
		});
		describe('listing segments', () => {
			describe('when there are no segments', () => {
				it('returns 200');
				it('returns an empty list');
			});
			describe('when there are segments', () => {
				it('returns 200');
				it('returns the segments list');
				describe('the returned segments', () => {
					it('have an id');
					it('have a number of recipients');
				});
			});
			describe('when passing pagination filters', () => {
				describe('when filters are invalid', () => {
					it('returns 400');
				});
				describe('when filters are valid', () => {
					it('returns 200');
					it('returns the list with the applied filters');
				});
			});
		});
	});
	describe('campaigns', () => {
		describe('creating a campaign', () => {
			describe('when the segment is not found', () => {
				it('returns 400');
			});
			describe('when the segment is found', () => {
				describe('when the message is empty', () => {
					it('returns 400');
				});
				describe('when the message contains template fields', () => {
					it('validates the allowed fields or returns 400');
				});
			});
			describe('when data is ok', () => {
				it('returns 201');
				it('returns the campaign');
				describe('the returned campaign', () => {
					it('has an id');
					it('has the segment info');
				});
			});
		});
		describe('retrieving a campaign', () => {
			describe('when the campaign is not found', () => {
				it('returns 404');
			});
			describe('when the campaign is found', () => {
				it('returns 200');
				it('returns the campaign');
				describe('the returned campaign', () => {
					it('has an id');
					it('has the segment info');
				});
			});
		});
		describe('listing campaigns', () => {
			describe('when there are no campaigns', () => {
				it('returns 200');
				it('returns an empty list');
			});
			describe('when there are campaigns', () => {
				it('returns 200');
				it('returns the campaigns list');
				describe('the returned campaigns', () => {
					it('have an id');
					it('have the segment info');
				});
				describe('when passing pagination filters', () => {
					describe('when filters are invalid', () => {
						it('returns 400');
					});
					describe('when filters are valid', () => {
						it('returns 200');
						it('returns the list with the applied filters');
					});
				});
			});
		});
		describe('previewing a campaign', () => {
			describe('when the campaign is not found', () => {
				it('returns 404');
			});
			describe('when the campaign is found', () => {
				it('returns 200');
				it('returns the campaign id');
				it('returns the campaign message preview');
				describe('with templating', () => {
					it('has dummy test data correctly placed in the message');
				});
			});
		});
		describe('sending a campaign', () => {
			describe(`when the campaign is "in_progress"`, () => {
				it('returns 400');
				it('returns a clear error message with the current status');
			});
			describe(`when the campaign is "scheduled"`, () => {
				it('returns 400');
				it('returns a clear error message with the current status');
			});
			describe(`when the campaign is "completed"`, () => {
				it('returns 400');
				it('returns a clear error message with the current status');
			});
			describe(`when the campaign is "canceled"`, () => {
				// aka can be re-sent
				it('returns 200');
				it('returns the new campaign status data');
				it('has the segment info');
				describe('the returned data', () => {
					it(`has status "scheduled"`);
				});
			});
			describe(`when the campaign is "failed"`, () => {
				// aka can be re-sent
				it('returns 200');
				it('returns the new campaign status data');
				it('has the segment info');
				describe('the returned data', () => {
					it(`has status "scheduled"`);
				});
			});
			describe(`when the campaign is "pending"`, () => {
				it('returns 200');
				it('returns the new campaign status data');
				it('has the segment info');
				describe('the returned data', () => {
					it(`has status "scheduled"`);
					describe('after some time', () => {
						it(
							`has moved to either "in_progress", "failed", or "completed" status`,
						);
						describe(`when it's "completed"`, () => {
							it(`has a "completedAt" timestamp`);
						});
						describe(`when it's "failed"`, () => {
							it(`has a "failedAt" timestamp`);
							it(`has errors in the "errors" field`);
							it('has the progress until the failure'); // { progress: { sent: 1234 } }
						});
						describe(`when it's "in_progress"`, () => {
							it('has the current progress');
						});
					});
				});
			});
		});
		describe('getting a campaign status', () => {
			describe('when the campaign is not found', () => {
				it('returns 404');
			});
			describe('when the campaign is found', () => {
				it('returns 200');
				it('returns the campaign data');
				it('has the segment info');
				it('has the schedule data and timestamps');
				describe(`when the campaign is "in_progress"`, () => {
					it('returns the current progress'); // { progress: { sent: 1234 } }
					it(`has an up-to-date "udpatedAt" timestamp`);
				});
			});
		});
		describe('sending a test campaign', () => {
			describe('when the campaign is not found', () => {
				it('returns 404');
			});
			describe('when the campaign is found', () => {
				describe('when user ids are more than the limit', () => {
					it('returns 400');
				});
				describe('when user ids are empty', () => {
					it('returns 400');
				});
				describe('when the test recipients are ok', () => {
					it('returns 200');
					it('returns the test campaign status');
				});
			});
		});
		describe('canceling a campaign', () => {
			describe('when the campaign is not found', () => {
				it('returns 404');
			});
			describe('when the campaign is found', () => {
				describe(`when the campaign is "completed"`, () => {
					it('returns 400');
					it('returns the status in the error response');
				});
				describe(`when the campaign is "pending"`, () => {
					it('returns 400');
					it('returns the status in the error response');
				});
				describe(`when the campaign is "failed"`, () => {
					it('returns 400');
					it('returns the status in the error response');
				});
				describe(`when the campaign is "canceled"`, () => {
					it('returns 400');
					it('returns the status in the error response');
				});
				describe(`when the campaign is "in_progress"`, () => {
					it('returns 200');
					it('cancels the campaign');
					describe('after some time', () => {
						describe('the campaign status', () => {
							it(`is "canceled"`);
						});
					});
				});
				describe(`when the campaign is "scheduled"`, () => {
					it('returns 200');
					it('cancels the campaign');
					describe('after some time', () => {
						describe('the campaign status', () => {
							it(`is "canceled"`);
						});
					});
				});
			});
		});
	});
});
