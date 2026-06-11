import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { users, friendships, studyGroups, studyGroupMembers, dailyActivity } from "../drizzle/schema";
import { eq, and, or, desc, sql, inArray } from "drizzle-orm";

/**
 * Grammar Streak Leaderboard Router
 * 
 * Provides real-user leaderboard data from the database,
 * friend/study group management, and invite functionality.
 */
export const grammarLeaderboardRouter = router({
  /**
   * Get the user's friends leaderboard (grammar streak rankings)
   */
  getFriendsLeaderboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { leaderboard: [], userRank: 0, userStreak: 0 };

    const userId = ctx.user.id;

    // Get all accepted friends
    const friendRows = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(
            eq(friendships.requesterId, userId),
            eq(friendships.addresseeId, userId)
          )
        )
      );

    // Collect friend user IDs
    const friendIds = friendRows.map((f) =>
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );

    // Include current user
    const allUserIds = [userId, ...friendIds];

    if (allUserIds.length === 0) {
      return { leaderboard: [], userRank: 0, userStreak: 0 };
    }

    // Get user info for all participants
    const userInfos = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, allUserIds));

    // Calculate current streak for each user from daily_activity
    // A streak = consecutive days with activity ending today or yesterday
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Get recent activity for all users (last 60 days)
    const sixtyDaysAgo = new Date(today);
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split("T")[0];

    const activities = await db
      .select()
      .from(dailyActivity)
      .where(
        and(
          inArray(dailyActivity.userId, allUserIds),
          sql`${dailyActivity.date} >= ${sixtyDaysAgoStr}`
        )
      );

    // Calculate streaks per user
    const userStreaks: Record<number, { streak: number; totalReviews: number }> = {};

    for (const uid of allUserIds) {
      const userActivities = activities
        .filter((a) => a.userId === uid)
        .map((a) => a.date)
        .sort()
        .reverse(); // Most recent first

      let streak = 0;
      const totalReviews = activities
        .filter((a) => a.userId === uid)
        .reduce((sum, a) => sum + (a.exercisesCompleted || 0), 0);

      if (userActivities.length > 0) {
        // Check if most recent activity is today or yesterday
        const mostRecent = userActivities[0];
        if (mostRecent === todayStr || mostRecent === yesterdayStr) {
          streak = 1;
          let checkDate = new Date(mostRecent!);

          for (let i = 1; i < userActivities.length; i++) {
            checkDate.setDate(checkDate.getDate() - 1);
            const expectedStr = checkDate.toISOString().split("T")[0];
            if (userActivities[i] === expectedStr) {
              streak++;
            } else {
              break;
            }
          }
        }
      }

      userStreaks[uid] = { streak, totalReviews };
    }

    // Build leaderboard entries
    const leaderboard = userInfos
      .map((u) => ({
        id: String(u.id),
        name: u.id === userId ? "You" : (u.name || "Anonymous"),
        avatar: u.id === userId ? "🧑‍🎓" : getAvatarForUser(u.id),
        streak: userStreaks[u.id]?.streak || 0,
        totalReviews: userStreaks[u.id]?.totalReviews || 0,
        isCurrentUser: u.id === userId,
        rank: 0,
      }))
      .sort((a, b) => b.streak - a.streak || b.totalReviews - a.totalReviews)
      .map((entry, i) => ({ ...entry, rank: i + 1 }));

    const userEntry = leaderboard.find((e) => e.isCurrentUser);

    return {
      leaderboard,
      userRank: userEntry?.rank || 0,
      userStreak: userEntry?.streak || 0,
    };
  }),

  /**
   * Get study group leaderboard
   */
  getGroupLeaderboard: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { leaderboard: [], groupName: "", userRank: 0 };

      const userId = ctx.user.id;

      // Get group info
      const [group] = await db
        .select()
        .from(studyGroups)
        .where(eq(studyGroups.id, input.groupId));

      if (!group) return { leaderboard: [], groupName: "", userRank: 0 };

      // Get group members
      const members = await db
        .select({ userId: studyGroupMembers.userId })
        .from(studyGroupMembers)
        .where(eq(studyGroupMembers.groupId, input.groupId));

      const memberIds = members.map((m) => m.userId);

      if (memberIds.length === 0) {
        return { leaderboard: [], groupName: group.name, userRank: 0 };
      }

      // Get user info
      const userInfos = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(inArray(users.id, memberIds));

      // Get streak data (same logic as above)
      const today = new Date();
      const sixtyDaysAgo = new Date(today);
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const sixtyDaysAgoStr = sixtyDaysAgo.toISOString().split("T")[0];
      const todayStr = today.toISOString().split("T")[0];
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];

      const activities = await db
        .select()
        .from(dailyActivity)
        .where(
          and(
            inArray(dailyActivity.userId, memberIds),
            sql`${dailyActivity.date} >= ${sixtyDaysAgoStr}`
          )
        );

      const userStreaks: Record<number, { streak: number; totalReviews: number }> = {};
      for (const uid of memberIds) {
        const userActivities = activities
          .filter((a) => a.userId === uid)
          .map((a) => a.date)
          .sort()
          .reverse();

        let streak = 0;
        const totalReviews = activities
          .filter((a) => a.userId === uid)
          .reduce((sum, a) => sum + (a.exercisesCompleted || 0), 0);

        if (userActivities.length > 0) {
          const mostRecent = userActivities[0];
          if (mostRecent === todayStr || mostRecent === yesterdayStr) {
            streak = 1;
            let checkDate = new Date(mostRecent!);
            for (let i = 1; i < userActivities.length; i++) {
              checkDate.setDate(checkDate.getDate() - 1);
              const expectedStr = checkDate.toISOString().split("T")[0];
              if (userActivities[i] === expectedStr) {
                streak++;
              } else {
                break;
              }
            }
          }
        }
        userStreaks[uid] = { streak, totalReviews };
      }

      const leaderboard = userInfos
        .map((u) => ({
          id: String(u.id),
          name: u.id === userId ? "You" : (u.name || "Anonymous"),
          avatar: u.id === userId ? "🧑‍🎓" : getAvatarForUser(u.id),
          streak: userStreaks[u.id]?.streak || 0,
          totalReviews: userStreaks[u.id]?.totalReviews || 0,
          isCurrentUser: u.id === userId,
          rank: 0,
        }))
        .sort((a, b) => b.streak - a.streak || b.totalReviews - a.totalReviews)
        .map((entry, i) => ({ ...entry, rank: i + 1 }));

      const userEntry = leaderboard.find((e) => e.isCurrentUser);

      return {
        leaderboard,
        groupName: group.name,
        userRank: userEntry?.rank || 0,
      };
    }),

  /**
   * Get user's study groups
   */
  getMyGroups: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const userId = ctx.user.id;

    const memberships = await db
      .select({ groupId: studyGroupMembers.groupId, role: studyGroupMembers.role })
      .from(studyGroupMembers)
      .where(eq(studyGroupMembers.userId, userId));

    if (memberships.length === 0) return [];

    const groupIds = memberships.map((m) => m.groupId);
    const groups = await db
      .select()
      .from(studyGroups)
      .where(inArray(studyGroups.id, groupIds));

    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      languageCode: g.languageCode,
      maxMembers: g.maxMembers,
      isAdmin: memberships.find((m) => m.groupId === g.id)?.role === "admin",
    }));
  }),

  /**
   * Create a study group
   */
  createGroup: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      description: z.string().optional(),
      languageCode: z.string().optional(),
      maxMembers: z.number().min(2).max(50).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, groupId: null };

      const userId = ctx.user.id;

      const [result] = await db.insert(studyGroups).values({
        name: input.name,
        description: input.description || null,
        languageCode: input.languageCode || null,
        maxMembers: input.maxMembers || 10,
        createdBy: userId,
      });

      const groupId = result.insertId;

      // Add creator as admin member
      await db.insert(studyGroupMembers).values({
        groupId: Number(groupId),
        userId,
        role: "admin",
      });

      return { success: true, groupId: Number(groupId) };
    }),

  /**
   * Generate an invite code for a study group
   */
  generateGroupInvite: protectedProcedure
    .input(z.object({ groupId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Generate a short invite code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      
      // Store in memory (could be Redis in production)
      groupInvites.set(code, {
        groupId: input.groupId,
        inviterId: ctx.user.id,
        createdAt: new Date(),
      });

      return {
        code,
        shareMessage: `Join my grammar study group on LinguaVibe! Use invite code: ${code}`,
        shareUrl: `linguavibe://join-group/${code}`,
      };
    }),

  /**
   * Accept a group invite
   */
  joinGroup: protectedProcedure
    .input(z.object({ inviteCode: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false, error: "Database unavailable" };

      const invite = groupInvites.get(input.inviteCode.toUpperCase());
      if (!invite) return { success: false, error: "Invalid or expired invite code" };

      const userId = ctx.user.id;

      // Check if already a member
      const existing = await db
        .select()
        .from(studyGroupMembers)
        .where(
          and(
            eq(studyGroupMembers.groupId, invite.groupId),
            eq(studyGroupMembers.userId, userId)
          )
        );

      if (existing.length > 0) {
        return { success: false, error: "Already a member of this group" };
      }

      // Check group capacity
      const [group] = await db
        .select()
        .from(studyGroups)
        .where(eq(studyGroups.id, invite.groupId));

      if (!group) return { success: false, error: "Group not found" };

      const memberCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(studyGroupMembers)
        .where(eq(studyGroupMembers.groupId, invite.groupId));

      if ((memberCount[0]?.count || 0) >= (group.maxMembers || 10)) {
        return { success: false, error: "Group is full" };
      }

      // Add member
      await db.insert(studyGroupMembers).values({
        groupId: invite.groupId,
        userId,
        role: "member",
      });

      return { success: true, groupName: group.name };
    }),

  /**
   * Send a friend request for grammar leaderboard
   */
  sendFriendRequest: protectedProcedure
    .input(z.object({ targetUserId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      const userId = ctx.user.id;
      if (userId === input.targetUserId) return { success: false };

      // Check if friendship already exists
      const existing = await db
        .select()
        .from(friendships)
        .where(
          or(
            and(eq(friendships.requesterId, userId), eq(friendships.addresseeId, input.targetUserId)),
            and(eq(friendships.requesterId, input.targetUserId), eq(friendships.addresseeId, userId))
          )
        );

      if (existing.length > 0) return { success: false };

      await db.insert(friendships).values({
        requesterId: userId,
        addresseeId: input.targetUserId,
        status: "pending",
      });

      return { success: true };
    }),

  /**
   * Accept a friend request
   */
  acceptFriendRequest: protectedProcedure
    .input(z.object({ friendshipId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { success: false };

      await db
        .update(friendships)
        .set({ status: "accepted" })
        .where(
          and(
            eq(friendships.id, input.friendshipId),
            eq(friendships.addresseeId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Get pending friend requests
   */
  getPendingRequests: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const pending = await db
      .select({
        id: friendships.id,
        requesterId: friendships.requesterId,
        createdAt: friendships.createdAt,
      })
      .from(friendships)
      .where(
        and(
          eq(friendships.addresseeId, ctx.user.id),
          eq(friendships.status, "pending")
        )
      );

    if (pending.length === 0) return [];

    const requesterIds = pending.map((p) => p.requesterId);
    const requesters = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(inArray(users.id, requesterIds));

    return pending.map((p) => ({
      id: p.id,
      requesterName: requesters.find((r) => r.id === p.requesterId)?.name || "Unknown",
      requesterId: p.requesterId,
      createdAt: p.createdAt,
    }));
  }),
});

// In-memory invite store (would be Redis in production)
const groupInvites = new Map<string, { groupId: number; inviterId: number; createdAt: Date }>();

// Deterministic avatar assignment based on user ID
function getAvatarForUser(userId: number): string {
  const avatars = ["👩‍💻", "👨‍🎨", "👩‍🔬", "👨‍🏫", "👩‍🎤", "🧑‍💼", "👩‍⚕️", "👨‍🚀", "👩‍🏫", "🧑‍🎓", "👨‍🍳", "👩‍🌾"];
  return avatars[userId % avatars.length];
}
