<?php
// deploy_hostinger/public_html/api/routes/public.php

if (preg_match('/^public\/profile\/([^\/]+)$/', $path, $matches) && $method === 'GET') {
    $userId = $matches[1];
    
    // Lookup the account associated with this user ID
    $profile = Db::fetch('
        SELECT a.id, a.name, a.status, a.plan_type, a.plan_expires_at, a.primary_color, 
               a.secondary_color, a.short_description, a.services_title, a.services_subtitle, 
               a.cover_image, a.view_mode, a.cover_opacity, a.profile_image, a.lifetime_appointments,
               a.timezone, a.country, a.currency, a.phone_country_code
        FROM cp_agenda_accounts a
        JOIN cp_agenda_users u ON u.account_id = a.id
        WHERE u.id = ?', [$userId]);
    
    if (!$profile) {
        Response::fail('Profile not found', 404);
    }

    // Set the dynamic timezone for any PHP date/time calculations in this request
    date_default_timezone_set($profile['timezone'] ?? 'Asia/Tokyo');

    if ($profile['status'] !== 'active') {
        // ✅ SECURITY [A-6]: Return only status info for non-active accounts
        // Never expose services, availability or appointments of suspended accounts
        Response::ok([
            'profile'      => ['status' => $profile['status'], 'name' => $profile['name']],
            'services'     => [],
            'availability' => ['workingHours' => [], 'blockedDates' => [], 'intervalMinutes' => 30],
            'appointments' => []
        ]);
    }


    // Fetch Services
    $services = Db::fetchAll('SELECT id, name, description, duration_min AS duration, cleaning_buffer_min AS cleaning_buffer, price, image_url, image_opacity, name_color, description_color FROM cp_agenda_services WHERE account_id = ? ORDER BY sort_order ASC', [$profile['id']]);
    foreach ($services as &$s) {
        $s['price'] = (float)$s['price'];
        $s['cleaning_buffer'] = (int)$s['cleaning_buffer'];
        $s['imageUrl'] = $s['image_url'] ?? '';
        $s['imageOpacity'] = isset($s['image_opacity']) ? (int)$s['image_opacity'] : 100;
        $s['nameColor'] = $s['name_color'] ?? null;
        $s['descriptionColor'] = $s['description_color'] ?? null;
    }

    // Fetch Availability
    $availability = Db::fetch('SELECT working_hours, interval_minutes, available_months FROM cp_agenda_availability WHERE account_id = ?', [$profile['id']]);
    
    // Fetch Blocked Dates
    $blocked = Db::fetchAll('SELECT blocked_date as date, start_time as startTime, end_time as endTime, reason FROM cp_agenda_blocked_dates WHERE account_id = ?', [$profile['id']]);

    if ($availability) {
        $rawHours = $availability['working_hours'] ?? '[]';
        $availability['workingHours'] = is_string($rawHours) ? json_decode($rawHours, true) : $rawHours;
        $availability['blockedDates'] = $blocked;
        $availability['intervalMinutes'] = (int)($availability['interval_minutes'] ?? 30);
        
        $rawMonths = $availability['available_months'] ?? null;
        $availability['availableMonths'] = is_string($rawMonths) ? json_decode($rawMonths, true) : ($rawMonths ?? [1,2,3,4,5,6,7,8,9,10,11,12]);
        
        unset($availability['working_hours']);
        unset($availability['interval_minutes']);
        unset($availability['available_months']);
    } else {
        $availability = [
            'workingHours' => [], 
            'blockedDates' => $blocked, 
            'intervalMinutes' => 30,
            'availableMonths' => [1,2,3,4,5,6,7,8,9,10,11,12]
        ];
    }

    // Fetch Busy Slots (Future only, confirmed/pending)
    // We use end_datetime which now includes the cleaning buffer
    $appointments = Db::fetchAll("SELECT start_at AS startAt, end_datetime AS endAt, duration, status FROM cp_agenda_appointments WHERE account_id = ? AND deleted_at IS NULL AND start_at >= DATE_SUB(NOW(), INTERVAL 1 DAY) AND status IN ('confirmed', 'pending')", [$profile['id']]);

    Response::ok([
        'profile' => $profile,
        'services' => $services,
        'availability' => $availability,
        'appointments' => $appointments
    ]);
}

if (preg_match('/^public\/view\/([^\/]+)$/', $path, $matches) && $method === 'POST') {
    $userId = $matches[1];
    
    // Check if the current logged-in user is the same as the user profile being viewed
    $currentUser = Auth::getUser();
    if ($currentUser && isset($currentUser['id']) && (string)$currentUser['id'] === (string)$userId) {
        // Skip increment
        Response::ok(['success' => true, 'skipped' => true]);
    }
    
    // Increment page_views for the account associated with this user ID
    $updated = Db::query('UPDATE cp_agenda_accounts SET page_views = page_views + 1 WHERE id = (SELECT account_id FROM cp_agenda_users WHERE id = ?)', [$userId]);
    
    if ($updated) {
        Response::ok(['success' => true]);
    } else {
        Response::fail('Account not found', 404);
    }
}

if ($path === 'public/log-error' && $method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    Monitor::clientError($data);
    Response::ok(['success' => true]);
}

Response::fail('Not Found', 404);

