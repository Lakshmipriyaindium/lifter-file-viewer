import React from 'react';
import { CustomContentProps } from '../../types';
import { TREEMAP_THRESHOLDS } from '../../constants';
import { getTreemapFontSizes, truncateTreemapLabel } from '../../utils';

export const TreemapCustomContent: React.FC<CustomContentProps> = (props) => {
  const {
    x = 0,
    y = 0,
    width = 0,
    height = 0,
    name = '',
    fill = '#8884d8',
    itemType,
    capsCount,
    featsCount,
    storiesCount
  } = props;

  const showName =
    width >= TREEMAP_THRESHOLDS.showName.width && height >= TREEMAP_THRESHOLDS.showName.height;
  const showBasicMetrics =
    width >= TREEMAP_THRESHOLDS.showBasicMetrics.width &&
    height >= TREEMAP_THRESHOLDS.showBasicMetrics.height;
  const showDetailedMetrics =
    width >= TREEMAP_THRESHOLDS.showDetailedMetrics.width &&
    height >= TREEMAP_THRESHOLDS.showDetailedMetrics.height;
  const showDrillBadge =
    width >= TREEMAP_THRESHOLDS.showDrillBadge.width &&
    height >= TREEMAP_THRESHOLDS.showDrillBadge.height;

  const { fontSize, metricFontSize } = getTreemapFontSizes(width, height);

  return (
    <g style={{ cursor: 'pointer' }}>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill,
          stroke: '#fff',
          strokeWidth: 2,
          strokeOpacity: 1
        }}
        className="transition-all duration-300 hover:brightness-110"
      />
      {showName && (
        <text
          x={x + width / 2}
          y={
            showDetailedMetrics
              ? y + height / 2 - 25
              : showBasicMetrics
                ? y + height / 2 - 10
                : y + height / 2 + fontSize / 3
          }
          textAnchor="middle"
          fill="#fff"
          fontSize={fontSize}
          fontWeight="bold"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}
        >
          {truncateTreemapLabel(name, width)}
        </text>
      )}

      {showDetailedMetrics ? (
        <>
          {capsCount !== undefined && capsCount > 0 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 5}
              textAnchor="middle"
              fill="#fff"
              fontSize={metricFontSize}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              📂 {capsCount} capabilities
            </text>
          )}
          {featsCount !== undefined && featsCount > 0 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + (capsCount !== undefined ? 22 : 5)}
              textAnchor="middle"
              fill="#fff"
              fontSize={metricFontSize}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              ⚡ {featsCount} features
            </text>
          )}
          {storiesCount !== undefined && storiesCount > 0 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + (capsCount !== undefined ? 39 : 22)}
              textAnchor="middle"
              fill="#fff"
              fontSize={metricFontSize}
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              📋 {storiesCount} user stories
            </text>
          )}
        </>
      ) : showBasicMetrics ? (
        <text
          x={x + width / 2}
          y={y + height / 2 + 15}
          textAnchor="middle"
          fill="#fff"
          fontSize={metricFontSize}
          style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
        >
          {itemType === 'Domain'
            ? `${featsCount} features`
            : itemType === 'Capability'
              ? `${featsCount} features`
              : `${storiesCount} stories`}
        </text>
      ) : null}

      {showDrillBadge && (
        <g opacity="0.6">
          <circle cx={x + width - 20} cy={y + 20} r="12" fill="rgba(255, 255, 255, 0.2)" />
          <text
            x={x + width - 20}
            y={y + 25}
            textAnchor="middle"
            fill="#fff"
            fontSize="16"
            fontWeight="bold"
          >
            +
          </text>
        </g>
      )}
    </g>
  );
};
