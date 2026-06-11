jest.mock('bull')

const Bull = require('bull')
const mockAdd = jest.fn().mockResolvedValue({ id: '1' })
Bull.mockImplementation(() => ({ add: mockAdd, on: jest.fn() }))

const { enqueue } = require('../src/services/queue.service')

describe('QueueService', () => {
  beforeEach(() => jest.clearAllMocks())

  it('calls queue.add with type and payload', async () => {
    await enqueue('document_ready', { userId: 'u1' })
    expect(mockAdd).toHaveBeenCalledWith('document_ready', { userId: 'u1' }, expect.any(Object))
  })

  it('assigns higher priority to workspace_invite', async () => {
    await enqueue('workspace_invite', {})
    const opts = mockAdd.mock.calls[0][2]
    expect(opts.priority).toBe(1)
  })

  it('assigns lower priority to document_ready', async () => {
    await enqueue('document_ready', {})
    const opts = mockAdd.mock.calls[0][2]
    expect(opts.priority).toBe(5)
  })
})
