import chai from 'chai';
import { v4 as uuidv4 } from 'uuid';
import { getServerTestClient } from './utils';
const expect = chai.expect;

(() => {
	if (!process.env.STREAM_LOCAL_TEST_RUN) {
		return;
	}
	const doRequest = async (fn) => {
		try {
			return await fn();
		} catch (err) {
			return err.response.data;
		}
	};
	const randomUUID = uuidv4();
	const createdSegments = [];
	const createdCampaigns = [];
	describe('campaigns', () => {
		let client;
		before(async () => {
			client = await getServerTestClient();
		});

		const cleanup = async () => {
			try {
				await Promise.all(
					createdCampaigns.map(async (c) => client.deleteCampaign(c.id)),
				);
			} catch (err) {}
			try {
				await Promise.all(
					createdSegments.map(async (s) => client.deleteSegment(s.id)),
				);
			} catch (err) {}
		};

		after(async () => {
			await cleanup();
		});

		describe('segments', () => {
			describe('creating a segment', () => {
				describe('when the name is empty', () => {
					it('returns 400', async () => {
						const resp = await doRequest(() =>
							client.createSegment({ description: 'foo' }),
						);
						expect(resp.StatusCode).to.equal(400);
					});
				});
				describe('when the description is empty', () => {
					it('returns 400', async () => {
						const resp = await doRequest(() =>
							client.createSegment({ name: 'foo' }),
						);
						expect(resp.StatusCode).to.equal(400);
					});
				});
				describe('when the name/description are not empty', () => {
					describe('when filter is empty', () => {
						it('returns 400', async () => {
							const resp = await doRequest(() =>
								client.createSegment({
									name: 'a-segment',
									description: 'test-segment',
								}),
							);
							expect(resp.StatusCode).to.equal(400);
						});
					});
					describe('when filter contains channel', () => {
						describe('when type is missing/empty', () => {
							it('returns 400', async () => {
								const resp = await doRequest(() =>
									client.createSegment({
										name: 'a-segment',
										description: 'test-segment',
										filter: { channel: { type: '' } },
									}),
								);
								expect(resp.StatusCode).to.equal(400);
							});
						});
					});
					describe('when filter contains user', () => {
						it('validates contents/props or returns 400'); // TODO
					});
					describe('when filter is ok', () => {
						let segment;
						before(async () => {
							const resp = await doRequest(() =>
								client.createSegment({
									name: 'a-segment',
									description: 'test-segment',
									filter: {
										channel: {
											type: 'messaging',
										},
									},
								}),
							);
							expect(resp).not.to.have.property('exception_fields');
							segment = resp.segment;
							createdSegments.push(segment);
						});
						it('returns the new segment', () => {
							expect(segment).not.to.be.undefined;
							expect(segment).not.to.have.property('exception_fields');
						});
						describe('the returned segment', () => {
							it('has an id', () => {
								expect(segment).to.have.property('id');
							});
							it('has a number of recipients', () => {
								expect(segment).to.have.property('recipients');
								expect(segment.recipients).to.be.a('number');
							});
						});
					});
				});
			});
			describe('retrieving a segment', () => {
				let existingSegment;
				before(async () => {
					const resp = await doRequest(() =>
						client.createSegment({
							name: 'a-segment',
							description: 'test-segment',
							filter: { channel: { type: 'messaging' } },
						}),
					);
					expect(resp).not.to.have.property('exception_fields');
					existingSegment = resp.segment;
					createdSegments.push(existingSegment);
				});
				describe('when the segment is not found', () => {
					it('returns 404', async () => {
						const resp = await doRequest(() => client.getSegment(randomUUID));
						expect(resp.StatusCode).to.equal(404);
					});
				});
				describe('when the segment is found', () => {
					let segment;
					before(async () => {
						segment = await doRequest(() =>
							client.getSegment(existingSegment.id),
						);
						expect(segment).not.to.have.property('exception_fields');
					});
					it('returns the segment', () => {
						expect(segment).not.to.be.undefined;
					});
					describe('returned segment', () => {
						it('has an id', () => {
							expect(segment.id).to.equal(existingSegment.id);
						});
						it('has a number of recipients', () => {
							expect(segment).to.have.property('recipients');
							expect(segment.recipients).to.be.a('number');
						});
					});
				});
			});
			describe('listing segments', () => {
				describe('when there are no segments', () => {
					before(async () => {
						await cleanup();
					});
					it('returns an empty list', async () => {
						const resp = await doRequest(() => client.listSegments());
						expect(resp).not.to.have.property('exception_fields');
						expect(resp.segments).to.deep.equal([]);
					});
				});
				describe('when there are segments', () => {
					let segments;
					before(async () => {
						for (let i = 0; i < 5; i++) {
							await client.createSegment({
								name: `a-segment-${i}`,
								description: `test-segment-${i}`,
								filter: { channel: { type: 'messaging' } },
							});
						}

						const resp = await doRequest(() => client.listSegments());
						expect(resp).not.to.have.property('exception_fields');
						segments = resp.segments;
						createdSegments.push(...segments);
					});
					it('returns the segments list', () => {
						expect(segments).to.be.an('array');
						expect(segments).to.have.length(5);
					});
					describe('the returned segments', () => {
						it('have an id', () => {
							for (const segment of segments) {
								expect(segment).to.have.property('id');
							}
						});
						it('have a number of recipients', () => {
							for (const segment of segments) {
								expect(segment).to.have.property('recipients');
								expect(segment.recipients).to.be.a('number');
							}
						});
					});
				});
				describe('when passing pagination filters', () => {
					describe('when filters are invalid', () => {
						it('returns 400', async () => {
							const limitResp = await doRequest(() =>
								client.listSegments({ limit: -1 }),
							);
							expect(limitResp.StatusCode).to.equal(400);
							const offsetResp = await doRequest(() =>
								client.listSegments({ limit: -1 }),
							);
							expect(offsetResp.StatusCode).to.equal(400);
						});
					});
					describe('when filters are valid', () => {
						it('returns the list with the applied filters', async () => {
							const limitResp = await doRequest(() =>
								client.listSegments({ limit: 3 }),
							);
							expect(limitResp.segments).to.have.length(3);
							expect(limitResp.segments[0].description).to.equal(
								'test-segment-0',
							);

							const offsetResp = await doRequest(() =>
								client.listSegments({ offset: 2, limit: 2 }),
							);
							expect(offsetResp.segments).to.have.length(2);
							expect(offsetResp.segments[0].description).to.equal(
								'test-segment-2',
							);
						});
					});
				});
			});
			describe('updating a segment', () => {
				describe('when the segment is not found', () => {
					it('returns 404', async () => {
						const resp = await doRequest(() =>
							client.updateSegment(randomUUID, {
								description: 'updated!',
							}),
						);
						expect(resp.StatusCode).to.equal(404);
					});
				});
				describe('when the segment is found', () => {
					let existingSegment;
					before(async () => {
						const resp = await doRequest(() =>
							client.createSegment({
								name: 'a-segment',
								description: 'test segment',
								filter: {
									channel: { type: 'messaging' },
								},
							}),
						);
						expect(resp).not.to.have.property('exception_fields');
						existingSegment = resp.segment;
						createdSegments.push(existingSegment);
					});
					describe('when the update fields are missing', () => {
						it('returns 400', async () => {
							const resp = await doRequest(() =>
								client.updateSegment(existingSegment.id, {}),
							);
							expect(resp.StatusCode).to.equal(400);
						});
					});
					describe('when the update fields are ok', () => {
						it('returns the updated segment', async () => {
							const segment = await doRequest(() =>
								client.updateSegment(existingSegment.id, {
									description: 'updated!',
								}),
							);
							expect(segment).not.to.have.property('exception_fields');
							expect(segment.id).to.equal(existingSegment.id);
							expect(segment.description).to.equal('updated!');
							const retrieved = await doRequest(() =>
								client.getSegment(existingSegment.id),
							);
							expect(retrieved).not.to.have.property('exception_fields');
							expect(retrieved.id).to.equal(existingSegment.id);
							expect(retrieved.description).to.equal('updated!');
						});
					});
				});
			});
			describe('deleting a segment', () => {
				describe('when the segment is not found', () => {
					it('returns 404', async () => {
						const resp = await doRequest(() =>
							client.deleteSegment(randomUUID),
						);
						expect(resp.StatusCode).to.equal(404);
					});
				});
				describe('when the segment is found', () => {
					let existingSegment;
					before(async () => {
						const resp = await doRequest(() =>
							client.createSegment({
								name: 'a-segment',
								description: 'test segment',
								filter: {
									channel: { type: 'messaging' },
								},
							}),
						);
						expect(resp).not.to.have.property('exception_fields');
						existingSegment = resp.segment;
						createdSegments.push(existingSegment);
					});
					it('deletes the segment', async () => {
						const resp = await doRequest(() =>
							client.deleteSegment(existingSegment.id),
						);
						expect(resp).not.to.have.property('exception_fields');
						const retrieved = await doRequest(() =>
							client.getSegment(existingSegment.id),
						);
						expect(retrieved.StatusCode).to.equal(404);
					});
				});
			});
		});
		describe('campaigns', () => {
			describe('creating a campaign', () => {
				describe('when the segment is not found', () => {
					it('returns 400', async () => {
						const resp = await doRequest(() =>
							client.createCampaign({
								message: 'a test campaign',
								segment_id: randomUUID,
							}),
						);
						expect(resp.StatusCode).to.equal(400);
					});
				});
				describe('when the segment is found', () => {
					let segment;
					before(async () => {
						const resp = await doRequest(() =>
							client.createSegment({
								name: 'a-segment',
								description: 'test segment',
								filter: {
									channel: { type: 'messaging' },
								},
							}),
						);
						expect(resp).not.to.have.property('exception_fields');
						segment = resp.segment;
						createdSegments.push(segment);
					});
					describe('when the message is empty', () => {
						it('returns 400', async () => {
							const resp = await doRequest(() =>
								client.createCampaign({
									segment_id: segment.id,
								}),
							);
							expect(resp.StatusCode).to.equal(400);
						});
					});
					describe('when the message contains template fields', () => {
						it('validates the allowed fields or returns 400'); // TODO
					});
					describe('when data is ok', () => {
						let campaign;
						before(async () => {
							const resp = await doRequest(() =>
								client.createCampaign({
									segment_id: segment.id,
									message: 'a test campaign',
								}),
							);
							expect(resp).not.to.have.property('exception_fields');
							campaign = resp.campaign;
							createdCampaigns.push(campaign);
						});
						it('returns the campaign', () => {
							expect(campaign).not.to.be.undefined;
						});
						describe('the returned campaign', () => {
							it('has an id', () => {
								expect(campaign).to.have.property('id');
							});
							it('has the segment info', () => {
								expect(campaign).to.have.property('segment_id'); // TODO should this also include the segment data?
							});
						});
					});
				});
			});
			describe('retrieving a campaign', () => {
				let segment;
				before(async () => {
					const resp = await doRequest(() =>
						client.createSegment({
							name: 'a-segment',
							description: 'test segment',
							filter: {
								channel: { type: 'messaging' },
							},
						}),
					);
					expect(resp).not.to.have.property('exception_fields');
					segment = resp.segment;
					createdSegments.push(segment);
				});

				let existingCampaign;
				before(async () => {
					const resp = await doRequest(() =>
						client.createCampaign({
							segment_id: segment.id,
							message: 'a test campaign',
						}),
					);
					expect(resp).not.to.have.property('exception_fields');
					existingCampaign = resp.campaign;
					createdCampaigns.push(existingCampaign);
				});
				describe('when the campaign is not found', () => {
					it('returns 404', async () => {
						const resp = await doRequest(() =>
							client.getCampaign(randomUUID),
						);
						expect(resp.StatusCode).to.equal(404);
					});
				});
				describe('when the campaign is found', () => {
					let campaign;
					before(async () => {
						campaign = await doRequest(() =>
							client.getCampaign(existingCampaign.id),
						);
						expect(campaign).not.to.have.property('exception_fields');
					});
					it('returns the campaign', () => {
						expect(campaign).not.to.be.undefined;
					});
					describe('the returned campaign', () => {
						it('has an id', () => {
							expect(campaign).to.have.property('id');
							expect(campaign.id).to.equal(existingCampaign.id);
						});
						it('has the segment info', () => {
							expect(campaign).to.have.property('segment_id');
							expect(campaign.segment_id).to.equal(segment.id);
						});
					});
				});
			});
			describe('listing campaigns', () => {
				before(async () => {
					await cleanup();
				});
				describe('when there are no campaigns', () => {
					it('returns an empty list', async () => {
						const resp = await doRequest(() => client.listCampaigns());
						expect(resp).not.to.have.property('exception_fields');
						expect(resp.campaigns).to.deep.equal([]);
					});
				});
				describe('when there are campaigns', () => {
					let segment;
					before(async () => {
						const resp = await doRequest(() =>
							client.createSegment({
								name: 'a-segment',
								description: 'test segment',
								filter: {
									channel: { type: 'messaging' },
								},
							}),
						);
						expect(resp).not.to.have.property('exception_fields');
						segment = resp.segment;
						createdSegments.push(segment);
					});

					let campaigns;
					before(async () => {
						for (let i = 0; i < 5; i++) {
							await client.createCampaign({
								segment_id: segment.id,
								message: `a test campaign ${i}`,
							});
						}

						const resp = await doRequest(() => client.listCampaigns());
						expect(resp).not.to.have.property('exception_fields');
						campaigns = resp.campaigns;
						createdCampaigns.push(...campaigns);
					});
					it('returns the campaigns list', () => {
						expect(campaigns).to.be.an('array');
						expect(campaigns).to.have.length(5);
					});
					describe('the returned campaigns', () => {
						it('have an id', () => {
							for (const campaign of campaigns) {
								expect(campaign).to.have.property('id');
							}
						});
						it('have the segment info', () => {
							for (const campaign of campaigns) {
								expect(campaign).to.have.property('segment_id');
								expect(campaign.segment_id).to.equal(segment.id);
							}
						});
					});
					describe('when passing pagination filters', () => {
						describe('when filters are invalid', () => {
							it('returns 400', async () => {
								const limitResp = await doRequest(() =>
									client.listCampaigns({
										limit: -1,
									}),
								);
								expect(limitResp.StatusCode).to.equal(400);
								const offsetResp = await doRequest(() =>
									client.listCampaigns({
										limit: -1,
									}),
								);
								expect(offsetResp.StatusCode).to.equal(400);
							});
						});
						describe('when filters are valid', () => {
							it('returns the list with the applied filters', async () => {
								const limitResp = await doRequest(() =>
									client.listCampaigns({
										limit: 3,
									}),
								);
								expect(limitResp.campaigns).to.have.length(3);
								expect(limitResp.campaigns[0].message).to.equal(
									'a test campaign 0',
								);

								const offsetResp = await doRequest(() =>
									client.listCampaigns({
										offset: 2,
										limit: 2,
									}),
								);
								expect(offsetResp.campaigns).to.have.length(2);
								expect(offsetResp.campaigns[0].message).to.equal(
									'a test campaign 2',
								);
							});
						});
					});
				});
			});
			describe('updating a campaign', () => {
				let segment;
				before(async () => {
					const resp = await doRequest(() =>
						client.createSegment({
							name: 'a-segment',
							description: 'test segment',
							filter: {
								channel: { type: 'messaging' },
							},
						}),
					);
					expect(resp).not.to.have.property('exception_fields');
					segment = resp.segment;
					createdSegments.push(segment);
				});
				let campaign;
				before(async () => {
					const resp = await doRequest(() =>
						client.createCampaign({
							segment_id: segment.id,
							message: 'a test campaign',
						}),
					);
					expect(resp).not.to.have.property('exception_fields');
					campaign = resp.campaign;
					createdCampaigns.push(campaign);
				});

				describe('when the campaign is not found', () => {
					it('returns 404', async () => {
						const resp = await doRequest(() =>
							client.updateCampaign(randomUUID, {
								segment_id: segment.id,
								message: 'updated!',
							}),
						);
						expect(resp.StatusCode).to.equal(404);
					});
				});
				describe('when the campaign is found', () => {
					describe('when the update params are empty', () => {
						it('returns 400', async () => {
							const resp = await doRequest(() =>
								client.updateCampaign(randomUUID, {}),
							);
							expect(resp.StatusCode).to.equal(400);
						});
					});
					describe('when the segment is not found', () => {
						it('returns 400', async () => {
							const resp = await doRequest(() =>
								client.updateCampaign(campaign.id, {
									segment_id: randomUUID,
									message: 'updated!',
								}),
							);
							expect(resp.StatusCode).to.equal(400);
						});
					});
					describe('when the update params are ok', () => {
						it('updates the campaign', async () => {
							const resp = await doRequest(() =>
								client.updateCampaign(campaign.id, {
									message: 'updated!',
								}),
							);
							expect(resp).not.to.have.property('exception_fields');
							expect(resp.id).to.equal(campaign.id);
							expect(resp.message).to.equal('updated!');
							const retrieved = await doRequest(() =>
								client.getCampaign(campaign.id),
							);
							expect(retrieved).not.to.have.property('exception_fields');
							expect(retrieved.message).to.equal('updated!');
						});
					});
				});
			});
			describe('deleting a campaign', () => {
				let segment;
				before(async () => {
					const resp = await doRequest(() =>
						client.createSegment({
							name: 'a-segment',
							description: 'test segment',
							filter: {
								channel: { type: 'messaging' },
							},
						}),
					);
					expect(resp).not.to.have.property('exception_fields');
					segment = resp.segment;
					createdSegments.push(segment);
				});
				let campaign;
				before(async () => {
					const resp = await doRequest(() =>
						client.createCampaign({
							segment_id: segment.id,
							message: 'a test campaign',
						}),
					);
					expect(resp).not.to.have.property('exception_fields');
					campaign = resp.campaign;
					createdCampaigns.push(campaign);
				});

				describe('when the campaign is not found', () => {
					it('returns 404', async () => {
						const resp = await doRequest(() =>
							client.deleteCampaign(randomUUID),
						);
						expect(resp.StatusCode).to.equal(404);
					});
				});
				describe('when the campaign is found', () => {
					before(async () => {
						const resp = await doRequest(() =>
							client.deleteCampaign(campaign.id),
						);
						expect(resp).not.to.have.property('exception_fields');
					});
					it('deletes the campaign', async () => {
						const retrieved = await doRequest(() =>
							client.getCampaign(campaign.id),
						);
						expect(retrieved.StatusCode).to.equal(404);
					});
					it('does not delete the related segment', async () => {
						const retrieved = await doRequest(() =>
							client.getSegment(segment.id),
						);
						expect(retrieved).not.to.have.property('exception_fields');
						expect(retrieved.id).to.equal(segment.id);
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
})();
