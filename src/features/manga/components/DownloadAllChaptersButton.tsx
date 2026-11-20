/*
 * Copyright (C) Contributors to the Suwayomi project
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

import type { BaseSyntheticEvent } from 'react';
import { useState } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import DownloadIcon from '@mui/icons-material/Download';
import { useLingui } from '@lingui/react/macro';
import { CustomTooltip } from '@/base/components/CustomTooltip.tsx';
import { Notifications } from '@/base/notification/Notifications.ts';
import { Chapters } from '@/features/chapter/services/Chapters.ts';
import { requestManager } from '@/lib/requests/RequestManager.ts';
import { defaultPromiseErrorHandler } from '@/lib/DefaultPromiseErrorHandler.ts';
import { getErrorMessage } from '@/lib/HelperFunctions.ts';

const stopEvent = (e: BaseSyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
};

/**
 * Downloads all chapters of a manga without having to open it.
 *
 * Entries that were not opened/added to the library yet do not have any chapters, thus, they get fetched from the
 * source first.
 */
export const DownloadAllChaptersButton = ({ mangaId }: { mangaId: number }) => {
    const { t } = useLingui();

    const [isLoading, setIsLoading] = useState(false);

    const downloadAllChapters = async () => {
        if (isLoading) {
            return;
        }

        setIsLoading(true);

        try {
            Notifications.info(t`Fetching chapters…`);

            const { data } = await requestManager.refreshManga(mangaId, { fetchManga: false, fetchChapters: true })
                .response;

            const chapterIds = Chapters.getIds(Chapters.getDownloadable(data?.fetchMangaAndChapters?.chapters ?? []));
            if (!chapterIds.length) {
                Notifications.info(t`No chapters available to download`);
                return;
            }

            // errors get already handled by the action itself
            await Chapters.download(chapterIds, true).catch(
                defaultPromiseErrorHandler('DownloadAllChaptersButton::download'),
            );
        } catch (e) {
            Notifications.error(t`Failed to fetch chapters`, getErrorMessage(e));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <CustomTooltip title={t`Download all chapters`}>
            <IconButton
                size="small"
                aria-label={t`Download all chapters`}
                aria-busy={isLoading}
                // the card is a link with press/long press handlers, the button must not trigger any of them
                onClick={(e) => {
                    stopEvent(e);
                    downloadAllChapters().catch(defaultPromiseErrorHandler('DownloadAllChaptersButton::click'));
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                onContextMenu={stopEvent}
                sx={{
                    flexShrink: 0,
                    width: 30,
                    height: 30,
                    backgroundColor: 'primary.main',
                    color: 'primary.contrastText',
                    '&:hover': { backgroundColor: 'primary.dark' },
                }}
            >
                {isLoading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon fontSize="small" />}
            </IconButton>
        </CustomTooltip>
    );
};
