import { nhost } from "./nhost"

type GraphQLResponse<Data> = {
  data?: Data
  error?: {
    message: string
  }
}

export async function graphqlRequest<Data = unknown, Vars = Record<string, any>>(
  query: string,
  variables?: Vars
): Promise<Data> {
  const { data, error } = await nhost.graphql.request<GraphQLResponse<Data>>(query, variables)

  if (error) {
    throw new Error(error.message)
  }

  // nhost.graphql.request returns `{ data, error }` where `data` already matches the query root
  // but some versions nest an extra `data`. Handle both just in case.
  const unwrapped = (data as unknown as any)?.data ?? data
  return unwrapped as Data
}


