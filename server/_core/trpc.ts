import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from "../../shared/const.js";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { runWithAIContext } from "../ai-request-context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;

/**
 * AI Security Context middleware — wraps all procedures so that any invokeLLM
 * call made during the request automatically has the user's identity and
 * security checks applied via AsyncLocalStorage.
 */
const withAISecurityContext = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  const userId = ctx.user?.id != null ? String(ctx.user.id) : undefined;

  // Run the entire procedure handler within the AI security context
  return runWithAIContext(
    {
      userId,
      isUserFacing: true,
      skipSecurity: false,
    },
    () => next({ ctx }),
  );
});

// All public procedures now run within AI security context
export const publicProcedure = t.procedure.use(withAISecurityContext);

const requireUser = t.middleware(async (opts) => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(withAISecurityContext).use(requireUser);

export const adminProcedure = t.procedure.use(withAISecurityContext).use(
  t.middleware(async (opts) => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== "admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
