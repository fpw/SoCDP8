/*
 *   SoCDP8 - A PDP-8/I implementation on a SoC
 *   Copyright (C) 2019 Folke Will <folko@solhost.org>
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU Affero General Public License as published by
 *   the Free Software Foundation, either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU Affero General Public License for more details.
 *
 *   You should have received a copy of the GNU Affero General Public License
 *   along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */

import { mkdirSync, readdirSync, readFileSync, promises, rmdirSync } from 'fs';
import { SystemConfiguration, DEFAULT_SYSTEM_CONF } from '../types/SystemConfiguration';
import { randomBytes } from 'crypto';

export class SystemConfigurationList {
    private readonly sysDir: string;
    private systems: Map<string, SystemConfiguration> = new Map();

    constructor(private readonly baseDir: string) {
        this.sysDir = this.baseDir + '/systems/';
        mkdirSync(this.sysDir, {recursive: true});

        this.loadSystems();

        if (!this.systems.has('default')) {
            this.addSystem(DEFAULT_SYSTEM_CONF, DEFAULT_SYSTEM_CONF.id);
        }
    }

    public getDirForSystem(sys: SystemConfiguration) {
        const cleanName = sys.name.replace(/[^a-zA-Z0-9_]/g, '').replace(/ /g, '_');
        return `${this.sysDir}/${cleanName}-${sys.id}/`;
    }

    public async saveSystem(sys: SystemConfiguration) {
        const dir = this.getDirForSystem(sys);
        const json = JSON.stringify(sys, null, 2);
        await promises.writeFile(`${dir}/system.json`, json);
    }

    private loadSystems() {
        for(const stateDir of readdirSync(this.sysDir)) {
            try {
                const dir = this.sysDir + '/' + stateDir;

                const configJson = readFileSync(dir + '/system.json');
                const sys = JSON.parse(configJson.toString()) as SystemConfiguration;

                this.systems.set(sys.id, sys);
            } catch (e) {
                console.log('Skipping system ' + stateDir + ': ' + e);
            }
        }
    }

    public getSystems(): SystemConfiguration[] {
        const res: SystemConfiguration[] = [];

        for (const conf of this.systems.values()) {
            res.push(conf);
        }

        return res;
    }

    public findSystemById(id: string): SystemConfiguration {
        const config = this.systems.get(id);
        if (!config) {
            throw Error('Unknown system');
        }

        return config;
    }

    public addSystem(sys: SystemConfiguration, id?: string) {
        if (id) {
            sys.id = id;
        } else {
            sys.id = this.generateSystemId();
        }

        const dir = this.getDirForSystem(sys);
        mkdirSync(dir, {recursive: true});

        this.saveSystem(sys);

        this.systems.set(sys.id, sys);
    }

    public deleteSystem(sys: SystemConfiguration) {
        const dir = this.getDirForSystem(sys);
        rmdirSync(dir, {recursive: true});
        this.systems.delete(sys.id);
    }

    private generateSystemId() {
        return randomBytes(5).toString('hex');
    }
}
