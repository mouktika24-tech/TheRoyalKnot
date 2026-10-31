function readFieldErrors(source) {
  if (!source || typeof source !== 'object') return {}

  if (!Array.isArray(source)) {
    return Object.fromEntries(
      Object.entries(source).map(([field, value]) => [
        field,
        typeof value === 'string'
          ? value
          : value?.message ?? value?.msg ?? String(value),
      ]),
    )
  }

  return source.reduce((errors, item) => {
    if (!item || typeof item !== 'object') return errors

    const field = item.field ?? item.path ?? item.property
    const message = item.message ?? item.msg ?? item.error
    if (typeof field === 'string' && message != null) {
      errors[field] = String(message)
    }

    return errors
  }, {})
}

export function getApiErrorDetails(error) {
  const responseData = error?.response?.data
  const normalizedValidation = error?.validation
  const normalizedApiError = error?.apiError
  const validationData = responseData?.validation
  const rawDetails =
    normalizedValidation?.details ??
    responseData?.details ??
    validationData?.details ??
    responseData?.errors ??
    validationData?.errors

  const fieldErrors =
    normalizedValidation?.fieldErrors &&
    Object.keys(normalizedValidation.fieldErrors).length > 0
      ? normalizedValidation.fieldErrors
      : readFieldErrors(rawDetails)

  const validationMessage =
    normalizedValidation?.message ??
    validationData?.message ??
    validationData?.error ??
    (error?.response?.status === 400
      ? responseData?.error ?? responseData?.message
      : undefined)

  const apiMessage =
    normalizedApiError?.message ??
    responseData?.error ??
    responseData?.message ??
    error?.message ??
    'Something went wrong. Please try again.'

  return {
    validationMessage,
    fieldErrors,
    apiMessage,
    details: rawDetails,
  }
}
