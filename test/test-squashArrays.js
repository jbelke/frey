import squashArrays from '../src/squashArrays'
import { expect } from 'chai'

describe('squashArrays', () => {
  it('should squash', (done) => {
    const fixture = {
      global: {
        terraformcfg: {
          parallelism: 1
        }
      },
      infra: [
        [{ output: 1 }],
        [{ output: 1 }],
        {
          provider: {
            aws: 1
          },
          resource: {
            aws_dynamodb_table: 1
          }
        }
      ]
    }

    const squashed = squashArrays(fixture)
    expect(squashed).to.deep.equal({
      global: {
        terraformcfg: {
          parallelism: 1
        }
      },
      infra: [
        {
          output: 1
        },
        {
          output: 1
        },
        {
          provider: {
            aws: 1
          },
          resource: {
            aws_dynamodb_table: 1
          }
        }
      ]
    })
    done()
  })
})
