import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response

    if (response?.status === 400) {
      const backendError = response.data
      const details = backendError?.details ?? []
      const detailItems = Array.isArray(details) ? details : [details]
      const fieldErrors = detailItems.reduce((errors, detail) => {
        if (detail && typeof detail === 'object' && typeof detail.field === 'string') {
          errors[detail.field] = detail.message ?? detail.error ?? 'Invalid value'
        }

        return errors
      }, {})

      error.validation = {
        message: backendError?.error ?? 'Validation failed',
        details,
        fieldErrors,
      }
    } else if (!response) {
      error.apiError = {
        message: 'Network error. Please check your connection and try again.',
        code: error.code,
      }
    } else {
      error.apiError = {
        message: response.data?.error ?? response.statusText ?? 'Request failed',
        status: response.status,
        details: response.data?.details,
      }
    }

    return Promise.reject(error)
  },
)

export default api
