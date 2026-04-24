import { getEffectiveStatus } from "../../framework/http/apiResponse.js";

function defaultIsSuccess(status) {
  return status >= 200 && status < 300;
}

export async function cleanupTrackedUsers({
  users,
  deleteUser,
  untrackUser,
  logger,
  label = "Cleanup user",
  isSuccess = defaultIsSuccess,
  isAlreadyAbsent = (status) => status === 404,
  afterUser,
}) {
  const failures = [];

  for (const user of [...users].reverse()) {
    try {
      const response = await deleteUser(user);
      const effectiveStatus = getEffectiveStatus(response);

      if (isSuccess(effectiveStatus)) {
        logger?.info(`${label} deleted`, { email: user.email });
      } else if (isAlreadyAbsent(effectiveStatus)) {
        logger?.info(`${label} already absent`, { email: user.email });
      } else {
        const failure = {
          email: user.email,
          error: `effectiveStatus=${effectiveStatus}`,
        };

        failures.push(failure);
        logger?.warn(`${label} delete returned non-success`, {
          email: user.email,
          effectiveStatus,
        });
      }
    } catch (error) {
      const failure = {
        email: user.email,
        error: String(error?.message || error),
      };

      failures.push(failure);
      logger?.warn(`${label} delete failed`, failure);
    } finally {
      untrackUser?.(user.email);
      await afterUser?.(user);
    }
  }

  return failures;
}
