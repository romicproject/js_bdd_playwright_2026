import { getEffectiveStatus } from "./response.assertions.js";

function toFailure(user, error) {
  return {
    email: user.email,
    error: String(error?.message || error),
  };
}

function defaultDescribeSuccess(prefix, effectiveStatus) {
  if (effectiveStatus === 404) {
    return `${prefix} User already absent`;
  }

  return `${prefix} User deleted`;
}

export async function executeTrackedUserCleanup({
  users,
  deleteUser,
  untrackUser,
  logger,
  prefix,
  missingConfigMessage,
  onUserProcessed,
}) {
  if (users.length === 0) {
    return [];
  }

  if (missingConfigMessage) {
    logger?.warn(`${prefix} Skipped: ${missingConfigMessage}`);
    return users.map((user) => ({
      email: user.email,
      error: missingConfigMessage,
    }));
  }

  const failures = [];

  for (const user of [...users].reverse()) {
    try {
      const response = await deleteUser(user);
      const effectiveStatus = getEffectiveStatus(response);

      if (effectiveStatus >= 200 && effectiveStatus < 300) {
        logger?.info(defaultDescribeSuccess(prefix, effectiveStatus), {
          email: user.email,
        });
      } else {
        const failure = {
          email: user.email,
          error: `effectiveStatus=${effectiveStatus}`,
        };
        failures.push(failure);
        logger?.warn(`${prefix} Delete returned non-success`, {
          email: user.email,
          effectiveStatus,
        });
      }
    } catch (error) {
      const failure = toFailure(user, error);
      failures.push(failure);
      logger?.warn(`${prefix} Delete failed`, failure);
    } finally {
      untrackUser(user.email);
      await onUserProcessed?.(user);
    }
  }

  if (failures.length > 0) {
    logger?.warn(`${prefix} Completed with failures`, {
      count: failures.length,
      emails: failures.map((failure) => failure.email),
    });
  }

  return failures;
}
