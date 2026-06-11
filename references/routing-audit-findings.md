# Routing & Wiring Audit Findings

## Critical Issues (Blocks User Flow)

### 1. Onboarding: `backButton` style missing from StyleSheet
- **File:** `app/onboarding.tsx` line 358
- **Issue:** `styles.backButton` is referenced but never defined in the StyleSheet.create section
- **Impact:** Back button renders without any styling (invisible or mispositioned)
- **Fix:** Add `backButton` style to the StyleSheet

### 2. Missing route file: `/teacher-lesson-planner`
- **File:** Referenced in `app/teacher-dashboard.tsx` (line 167, 475) and `app/teacher-assessment.tsx` (line 486)
- **Issue:** No `app/teacher-lesson-planner.tsx` file exists
- **Impact:** App crashes or shows blank screen when navigating to this route
- **Fix:** Create the file or redirect to an existing screen

### 3. Teacher tab: Notification bell has no onPress handler
- **File:** `app/(tabs)/teacher.tsx` line 146
- **Issue:** `<TouchableOpacity style={styles.notifBtn}>` has no onPress
- **Impact:** Dead button — user taps and nothing happens
- **Fix:** Add `onPress={() => router.push("/notification-center" as any)}`

### 4. Teacher tab: "Refresh" command button has no onPress handler
- **File:** `app/(tabs)/teacher.tsx` line 230
- **Issue:** `<TouchableOpacity style={styles.commandActionBtn}>` has no onPress
- **Impact:** Dead button
- **Fix:** Add appropriate refresh logic

## Medium Issues (Functional but Suboptimal)

### 5. Onboarding: No back buttons on birthday, level, schedule, or goal steps
- Steps 3 (birthday), 7 (level), 8 (schedule), 9 (goal) have no way to go back
- Only the language selection steps (5, 6) have a back button
- User is trapped if they want to change a previous answer

### 6. Messages tab: All conversations route to `/pen-pal`
- Every message row navigates to the same generic route regardless of conversation type
- Should differentiate between different conversation types

## Low Priority (Working but Could Be Better)

### 7. Onboarding → choose-teacher: No back button to return to onboarding
- Once user completes onboarding goals and lands on choose-teacher, they can only skip forward
- Not critical since onboarding is one-time flow

## Verified Working

- All tab navigation works (7 tabs registered and wired)
- Signup → onboarding routing works
- Onboarding → choose-teacher → permissions-setup → level-assessment → cloudwave-guide chain works
- Language selection FlatList fix (extraData + keyExtractor with step) is in place
- Profile tab navigation links all point to existing routes
- Explore tab navigation links all point to existing routes
- Songs tab navigation links all point to existing routes
- TV tab navigation links all point to existing routes
- Home tab navigation links all point to existing routes
- Only 1 missing route file out of 100+ referenced routes
